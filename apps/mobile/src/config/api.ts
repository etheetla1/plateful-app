import { Platform } from 'react-native';

// Production API URL
const PRODUCTION_API_URL = 'https://plateful-app-eta.vercel.app';

// Development API URLs
const DEVELOPMENT_API_URLS = {
  web: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
};

// Determine if we're in development or production
const isDevelopment = __DEV__;

export const API_BASE = isDevelopment 
  ? Platform.select(DEVELOPMENT_API_URLS)
  : PRODUCTION_API_URL;

export default API_BASE;