/**
 * Firebase Auth setup for testing
 * Configures Firebase Auth to connect to emulator or real Firebase
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';

let testApp: FirebaseApp | null = null;
let testAuth: Auth | null = null;

/**
 * Initialize Firebase Auth for testing
 * Connects to emulator if USE_FIREBASE_EMULATOR is set, otherwise uses real Firebase
 */
export function initTestFirebaseAuth(): Auth {
  if (testAuth) {
    return testAuth;
  }

  // Use test Firebase config (can use emulator or real project)
  // Try to load from environment, fallback to test values
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'test-api-key',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'test-project',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef',
  };

  // Warn if using test values
  if (firebaseConfig.apiKey === 'test-api-key') {
    console.warn('⚠️ Using test Firebase config. Set EXPO_PUBLIC_FIREBASE_* env vars for real Firebase.');
  }

  // Initialize Firebase app
  if (getApps().length === 0) {
    testApp = initializeApp(firebaseConfig, 'test-app');
  } else {
    testApp = getApps()[0];
  }

  // Initialize Auth
  testAuth = getAuth(testApp);

  // Connect to emulator if specified
  const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';
  if (useEmulator && !(testAuth as any)._delegate._config?.emulator) {
    try {
      connectAuthEmulator(testAuth, 'http://localhost:9099', { disableWarnings: true });
      console.log('✅ Connected to Firebase Auth Emulator');
    } catch (error: any) {
      if (error.message?.includes('already been called')) {
        // Already connected, ignore
      } else {
        console.warn('⚠️ Could not connect to emulator, using real Firebase:', error.message);
      }
    }
  }

  return testAuth;
}

/**
 * Get test auth instance
 */
export function getTestAuth(): Auth {
  if (!testAuth) {
    return initTestFirebaseAuth();
  }
  return testAuth;
}

/**
 * Clean up test Firebase instances
 */
export function cleanupTestFirebase() {
  // Firebase doesn't have a direct cleanup, but we can reset the references
  testAuth = null;
  testApp = null;
}

