import { Platform } from 'react-native';

// Production API URL
const PRODUCTION_API_URL = 'https://plateful-r73ybwu6f-elisha-theetlas-projects.vercel.app';

// Development API URLs
const DEVELOPMENT_API_URLS = {
  web: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
};

// Determine if we're in development or production
const isDevelopment = __DEV__;

// Force production API for now since we don't have local API server running
export const API_BASE = PRODUCTION_API_URL;

// Debug: Log the API base URL being used
console.log('🌐 API_BASE configured as:', API_BASE);

// Original logic (commented out):
// export const API_BASE = isDevelopment
//   ? Platform.select(DEVELOPMENT_API_URLS)
//   : PRODUCTION_API_URL;

export default API_BASE;