// Firebase Cloud Messaging Service Worker
// Place this file at the root of the public directory

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.VITE_FIREBASE_API_KEY || '',
  authDomain: self.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: self.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: self.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.VITE_FIREBASE_APP_ID || '',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, image } = payload.notification || {};
  const data = payload.data || {};
  const link = payload.fcmOptions?.link || data.link || '/';
  const imageUrl = image || data.image || data.imageUrl || '';

  const options = {
    body: body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { url: link },
  };

  if (imageUrl) {
    options.image = imageUrl;
  }

  self.registration.showNotification(title || 'Ace2Examz', options);
});

// Native push fallback to guarantee background delivery when browser is off
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || 'Ace2Examz';
    const body = notification.body || data.body || '';
    const image = notification.image || data.image || data.imageUrl || '';
    const icon = notification.icon || data.icon || '/icons/icon-192x192.png';
    const link = data.link || data.click_action || '/';

    const options = {
      body,
      icon,
      badge: '/icons/badge-72x72.png',
      data: { url: link },
    };

    if (image) {
      options.image = image;
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    // Fail-safe fallback if parsing fails
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
