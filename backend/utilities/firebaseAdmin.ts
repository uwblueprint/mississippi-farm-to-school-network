import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin once for Auth, Firestore, and Storage.
 * Returns true when initialized successfully.
 */
export function initializeFirebaseAdmin(): boolean {
  if (admin.apps.length) {
    return true;
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath) {
    // Prefer applicationDefault when GOOGLE_APPLICATION_CREDENTIALS is set;
    // fall back to cert(path) for explicit service-account JSON files.
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_DEFAULT_BUCKET,
      });
      return true;
    } catch {
      admin.initializeApp({
        credential: admin.credential.cert(credPath),
        storageBucket: process.env.FIREBASE_STORAGE_DEFAULT_BUCKET,
      });
      return true;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_SVC_ACCOUNT_PRIVATE_KEY?.trim();

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_DEFAULT_BUCKET,
    });
    return true;
  }

  console.warn(
    'Firebase Admin SDK not initialized — credentials not found. ' +
      'Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID + ' +
      'FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL + FIREBASE_SVC_ACCOUNT_PRIVATE_KEY in backend/.env'
  );
  return false;
}
