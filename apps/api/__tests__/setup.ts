// Jest setup file
import { jest, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from mobile app's .env file
// This allows tests to use the same Firebase config as the mobile app
dotenv.config({ path: path.resolve(__dirname, '../../mobile/.env') });

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.COSMOS_ENDPOINT = 'https://test.documents.azure.com:443/';
process.env.COSMOS_KEY = 'test-key';
process.env.COSMOS_DATABASE = 'test-db';

// Firebase config for testing (use real Firebase or emulator)
// Set USE_FIREBASE_EMULATOR=true to use emulator, otherwise uses real Firebase
// If using real Firebase, ensure EXPO_PUBLIC_FIREBASE_* vars are set
if (!process.env.USE_FIREBASE_EMULATOR) {
  // Use real Firebase - load from mobile app env or set here
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';
  process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
  process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '';
  process.env.EXPO_PUBLIC_FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '';
}

// Global test timeout (increased for real Firebase calls)
jest.setTimeout(30000);

// Optionally suppress console output during tests for cleaner output
// Set SUPPRESS_CONSOLE=true to hide console.log/error during tests
if (process.env.SUPPRESS_CONSOLE === 'true') {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  
  // Restore after all tests
  afterAll(() => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  });
}

