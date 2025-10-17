import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Debug: Log environment variables (only in development)
if (__DEV__) {
  console.log('📦 Firebase Config Check:');
  console.log('API Key:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('Project ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('Auth Domain:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN);
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
  throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
}

// Initialize Firebase (prevent duplicate initialization)
let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase App initialized successfully');
} catch (error) {
  console.error('❌ Firebase App initialization failed:', error);
  throw error;
}

// Initialize Firestore
let db: Firestore;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
} catch (error) {
  console.error('❌ Firestore initialization failed:', error);
  throw error;
}

// Initialize Auth with IndexedDB persistence (works with React Native)
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence
  });
  console.log('✅ Firebase Auth initialized successfully with IndexedDB persistence');
} catch (error) {
  // If already initialized, get existing instance
  auth = getAuth(app);
  console.log('✅ Firebase Auth instance retrieved');
}

console.log('🔥 Firebase fully initialized for project:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);

export { app, auth, db };
