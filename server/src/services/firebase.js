import admin from 'firebase-admin';

let initialized = false;

const getApp = () => {
  if (initialized) return admin;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase] FCM not configured – push notifications disabled');
    return null;
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  initialized = true;
  return admin;
};

/**
 * Send a push notification to a single FCM token.
 * Returns true on success, false on failure.
 */
export const sendPush = async (fcmToken, { title, body, link = '', image = '' }) => {
  const app = getApp();
  if (!app || !fcmToken) return false;
  try {
    const message = {
      token: fcmToken,
      notification: { title, body, ...(image && { image }) },
      android: {
        notification: {
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      },
      webpush: {
        fcmOptions: { link: link || '/' },
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          sound: 'default',
          ...(image && { image }),
        },
        ...(image && {
          data: { image }
        })
      },
    };
    await app.messaging().send(message);
    return true;
  } catch (err) {
    // Remove invalid tokens silently
    if (err.code === 'messaging/registration-token-not-registered') return 'invalid';
    console.error('[FCM] send error:', err.message);
    return false;
  }
};

/**
 * Send push to multiple FCM tokens in batches of 500.
 */
export const sendPushToMany = async (fcmTokens, payload) => {
  const app = getApp();
  if (!app || !fcmTokens?.length) return;
  const chunks = [];
  for (let i = 0; i < fcmTokens.length; i += 500) chunks.push(fcmTokens.slice(i, i + 500));
  for (const chunk of chunks) {
    const messages = chunk.map((token) => ({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.image && { image: payload.image })
      },
      android: {
        notification: {
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      },
      webpush: {
        fcmOptions: { link: payload.link || '/' },
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          sound: 'default',
          ...(payload.image && { image: payload.image }),
        },
        ...(payload.image && {
          data: { image: payload.image }
        })
      },
    }));
    try {
      await app.messaging().sendEach(messages);
    } catch (err) {
      console.error('[FCM] batch error:', err.message);
    }
  }
};
