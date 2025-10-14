import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Debug: Log environment variables
console.log('📦 Firebase Config Check:');
console.log('API Key:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing');
console.log('Project ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
console.log('Auth Domain:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN);

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
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase App initialized successfully');
} catch (error) {
  console.error('❌ Firebase App initialization failed:', error);
  throw error;
}

// Initialize Firestore
let db;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
} catch (error) {
  console.error('❌ Firestore initialization failed:', error);
  throw error;
}

// Initialize Storage
let storage;
try {
  storage = getStorage(app);
  console.log('✅ Storage initialized successfully');
} catch (error) {
  console.error('❌ Storage initialization failed:', error);
  throw error;
}

// Auth stub for Expo Go compatibility
// Firebase Auth Web SDK doesn't work in Expo Go - you'll need a development build
// For now, we export a mock auth object so the app doesn't crash
const auth = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
} as any;

console.log('⚠️ Firebase Auth is STUBBED - Auth features require a development build (not Expo Go)');
console.log('🔥 Firebase partially initialized for project:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);

export { app, auth, db, storage };
