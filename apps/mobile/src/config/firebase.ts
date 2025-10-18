import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Debug: Log environment variables (only in development)
if (__DEV__) {
  console.log('📦 Firebase Config Check:');
  console.log('API Key:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('Project ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('Auth Domain:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN);
  console.log('Storage Bucket:', process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET);
  console.log('Messaging Sender ID:', process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
  console.log('App ID:', process.env.EXPO_PUBLIC_FIREBASE_APP_ID);
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate config
const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error('❌ Missing Firebase config keys:', missingKeys);
  // Don't throw error immediately - let the app handle it gracefully
  console.warn('⚠️ Firebase configuration incomplete. Some features may not work.');
}

// Initialize Firebase (prevent duplicate initialization)
let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase App initialized successfully');
} catch (error) {
  console.error('❌ Firebase App initialization failed:', error);
  // Don't throw - let the app continue with limited functionality
  console.warn('⚠️ Firebase App initialization failed. Auth features will be disabled.');
  // Create a dummy app to prevent undefined errors
  app = {} as FirebaseApp;
}

// Initialize Firestore
let db: Firestore;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
} catch (error) {
  console.error('❌ Firestore initialization failed:', error);
  console.warn('⚠️ Firestore initialization failed. Database features will be disabled.');
}

// Initialize Auth with basic configuration (persistence handled automatically)
let auth: Auth;
try {
  auth = initializeAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
} catch (error: any) {
  console.error('❌ Firebase Auth initialization failed:', error);
  
  // Check if it's the "already initialized" error
  if (error.code === 'auth/already-initialized') {
    try {
      auth = getAuth(app);
      console.log('✅ Firebase Auth instance retrieved after already-initialized error');
    } catch (retryError) {
      console.error('❌ Failed to get auth instance after already-initialized error:', retryError);
      auth = {} as Auth;
    }
  } else {
    console.warn('⚠️ Firebase Auth initialization failed. Authentication features will be disabled.');
    // Create a dummy auth to prevent undefined errors
    auth = {} as Auth;
  }
}

console.log('🔥 Firebase fully initialized for project:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);

export { app, auth, db };
