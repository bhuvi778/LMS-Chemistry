import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;

/**
 * Generates an Agora RTC token for a given channel.
 * @param {string} channelName - The room/channel name (e.g. roomId).
 * @param {number} uid - User ID (0 allows any UID).
 * @param {string} role - 'publisher' (host) or 'subscriber' (audience).
 * @returns {object} - { token, appId }
 */
export const generateAgoraToken = (channelName, uid = 0, role = 'subscriber') => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.warn('⚠️ Agora credentials (AGORA_APP_ID, AGORA_APP_CERTIFICATE) are not set or partially set in .env. Fallback to tokenless/mock behavior.');
    return {
      token: appId ? "" : `mock_token_${channelName}_${role}`,
      appId: appId || 'mock_app_id_placeholder',
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
      token: `mock_token_${channelName}_${role}`,
      appId: appId,
    };
  }
};
