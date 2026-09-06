import * as admin from 'firebase-admin';

let initialized = false;

export const initFirebase = (): void => {
  if (initialized) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    console.warn(
      '⚠️  FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled'
    );
    return;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin:', (err as Error).message);
  }
};

export const getFirebaseAdmin = (): typeof admin | null => {
  if (!initialized) return null;
  return admin;
};
