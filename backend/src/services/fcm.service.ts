import { getFirebaseAdmin } from '../config/firebase';

export const sendFCMPush = async (
  fcmToken: string,
  title: string,
  body: string
): Promise<void> => {
  const admin = getFirebaseAdmin();
  if (!admin) {
    // Firebase not configured — skip silently
    return;
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
        },
      },
    });
  } catch (err) {
    console.warn('FCM push failed for token:', fcmToken, (err as Error).message);
  }
};
