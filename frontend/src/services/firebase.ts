import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { notificationService } from './notification.service';
import toast from 'react-hot-toast';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messaging: Messaging | null = null;

const isConfigured = (): boolean =>
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.messagingSenderId;

/**
 * Initialize Firebase messaging and register the FCM token with the backend.
 * Call this after an engineer logs in. Safe no-op if Firebase env vars are missing.
 */
export const initPushNotifications = async (): Promise<void> => {
  if (!isConfigured()) {
    console.info('Firebase not configured — skipping push notifications');
    return;
  }

  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.info('Browser does not support push notifications');
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Notification permission not granted');
      return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await notificationService.updateFcmToken(token);
    }

    // Foreground messages
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'New notification';
      const body = payload.notification?.body ?? '';
      toast(`${title}: ${body}`, { icon: '🔔' });
    });
  } catch (err) {
    console.warn('Failed to init push notifications:', err);
  }
};
