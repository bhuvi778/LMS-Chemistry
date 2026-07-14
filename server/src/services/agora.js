import pkg from 'agora-token';
// Uses Node 18+ built-in fetch — no external package needed
const { RtcTokenBuilder, RtcRole } = pkg;

const readAgoraEnv = () => {
  const clean = (value) => {
    const normalized = String(value || '').trim();
    return normalized && !['undefined', 'null', 'false'].includes(normalized.toLowerCase())
      ? normalized
      : '';
  };
  return {
    appId: clean(process.env.AGORA_APP_ID),
    appCertificate: clean(process.env.AGORA_APP_CERTIFICATE),
  };
};

/**
 * Generates an Agora RTC token for a given channel.
 * @param {string} channelName - The room/channel name (e.g. roomId).
 * @param {number} uid - User ID (0 allows any UID).
 * @param {string} role - 'publisher' (host) or 'subscriber' (audience).
 * @returns {object} - { token, appId }
 */
export const generateAgoraToken = (channelName, uid = 0, role = 'subscriber') => {
  const { appId, appCertificate } = readAgoraEnv();

  if (!appId || !appCertificate) {
    console.warn('⚠️ Agora credentials are missing or incomplete. Live room will use internal WebRTC fallback.');
    return {
      token: '',
      appId: '',
      fallbackMode: 'internal_webrtc',
    };
  }

  // Map role
  const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  const expirationTimeInSeconds = 3600 * 2; // 2 hours validity
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );
    return { token, appId };
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return {
      token: '',
      appId: '',
      fallbackMode: 'internal_webrtc',
    };
  }
};

// ─── Agora Cloud Recording REST API ───────────────────────────────────────────
// Requires: AGORA_APP_ID, AGORA_CUSTOMER_ID, AGORA_CUSTOMER_SECRET in .env
// Storage requires: AGORA_S3_BUCKET, AGORA_S3_ACCESS_KEY, AGORA_S3_SECRET_KEY,
//                   AGORA_S3_REGION (e.g. ap-south-1), AGORA_S3_VENDOR (1=AWS, 2=Alibaba)

const AGORA_RECORDING_BASE = 'https://api.agora.io/v1/apps';

const getRecordingAuth = () => {
  const customerId = process.env.AGORA_CUSTOMER_ID;
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
  if (!customerId || !customerSecret) {
    throw new Error('Agora Cloud Recording credentials not configured. Set AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET in .env');
  }
  const credentials = Buffer.from(`${customerId}:${customerSecret}`).toString('base64');
  return `Basic ${credentials}`;
};

/**
 * Start Agora Cloud Recording for a channel.
 * @param {string} channelName - The Agora channel name.
 * @param {string} token - Valid RTC publisher token for the recording UID.
 * @param {number} recordingUid - UID for the cloud recorder (e.g. 0).
 * @returns {object} - { resourceId, sid } to be stored in LiveClass
 */
export const startCloudRecording = async (channelName, token, recordingUid = 0) => {
  const appId = process.env.AGORA_APP_ID;
  if (!appId) throw new Error('AGORA_APP_ID not configured');

  const auth = getRecordingAuth();

  // Step 1: Acquire resource ID
  const acquireRes = await fetch(`${AGORA_RECORDING_BASE}/${appId}/cloud_recording/acquire`, {
    method: 'POST',
    headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cname: channelName,
      uid: String(recordingUid),
      clientRequest: {
        resourceExpiredHour: 24,
        scene: 0, // 0 = communication, 2 = live broadcast
      },
    }),
  });

  if (!acquireRes.ok) {
    const errText = await acquireRes.text();
    throw new Error(`Agora acquire failed: ${acquireRes.status} ${errText}`);
  }

  const { resourceId } = await acquireRes.json();

  // Step 2: Start recording
  const storageConfig = {
    vendor: Number(process.env.AGORA_S3_VENDOR || '1'),     // 1 = AWS S3
    region: Number(process.env.AGORA_S3_REGION_ID || '14'), // 14 = ap-south-1 (Mumbai)
    bucket: process.env.AGORA_S3_BUCKET || '',
    accessKey: process.env.AGORA_S3_ACCESS_KEY || '',
    secretKey: process.env.AGORA_S3_SECRET_KEY || '',
    fileNamePrefix: ['recordings', channelName],
  };

  const startRes = await fetch(
    `${AGORA_RECORDING_BASE}/${appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
    {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cname: channelName,
        uid: String(recordingUid),
        clientRequest: {
          token,
          recordingConfig: {
            maxIdleTime: 30,                // Stop if channel empty for 30s
            streamTypes: 2,                 // 0=audio, 1=video, 2=both
            channelType: 1,                 // 0=communication, 1=live-broadcast
            videoStreamType: 0,             // 0=high quality stream
            transcodingConfig: {
              height: 720,
              width: 1280,
              bitrate: 2260,
              fps: 24,
              mixedVideoLayout: 1,          // 1=best-fit layout
              backgroundColor: '#000000',
            },
          },
          storageConfig,
        },
      }),
    }
  );

  if (!startRes.ok) {
    const errText = await startRes.text();
    throw new Error(`Agora start recording failed: ${startRes.status} ${errText}`);
  }

  const { sid } = await startRes.json();
  return { resourceId, sid };
};

/**
 * Stop Agora Cloud Recording.
 * @param {string} channelName - The Agora channel name.
 * @param {string} resourceId - From startCloudRecording()
 * @param {string} sid - From startCloudRecording()
 * @param {number} recordingUid - Must match the uid used in start.
 * @returns {object} - { fileList, fileListMode } from Agora
 */
export const stopCloudRecording = async (channelName, resourceId, sid, recordingUid = 0) => {
  const appId = process.env.AGORA_APP_ID;
  if (!appId) throw new Error('AGORA_APP_ID not configured');

  const auth = getRecordingAuth();

  const stopRes = await fetch(
    `${AGORA_RECORDING_BASE}/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
    {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cname: channelName,
        uid: String(recordingUid),
        clientRequest: {},
      }),
    }
  );

  if (!stopRes.ok) {
    const errText = await stopRes.text();
    throw new Error(`Agora stop recording failed: ${stopRes.status} ${errText}`);
  }

  const data = await stopRes.json();
  // data.serverResponse.fileList contains an array of recording files
  return data?.serverResponse || {};
};

/**
 * Query the recording status from Agora.
 */
export const queryCloudRecording = async (resourceId, sid) => {
  const appId = process.env.AGORA_APP_ID;
  if (!appId) throw new Error('AGORA_APP_ID not configured');

  const auth = getRecordingAuth();

  const res = await fetch(
    `${AGORA_RECORDING_BASE}/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`,
    { method: 'GET', headers: { 'Authorization': auth } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Agora query recording failed: ${res.status} ${errText}`);
  }

  return res.json();
};
