import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin once per cold start
const adminApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

// Verify Firebase ID token from Authorization header and return uid
export async function verifyFirebaseToken(authorizationHeader?: string) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authorizationHeader.substring(7);
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded;
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}