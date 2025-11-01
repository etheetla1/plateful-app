import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  const env = process.env.NODE_ENV || Constants.expoConfig?.extra?.env || 'development';
  
  const urls = Constants.expoConfig?.extra?.apiBaseUrl || {
    development: 'http://localhost:3000',
    staging: 'https://your-staging-api.vercel.app',
    production: 'https://your-production-api.vercel.app'
  };
  
  return urls[env] || urls.production;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/chat`,
  RECIPE: `${API_BASE_URL}/api/recipe`,
  GENERATE_RECIPE: `${API_BASE_URL}/api/generate-recipe`,
  EXTRACT_INTENT: `${API_BASE_URL}/api/extract-intent`,
  MOCK_CHAT: `${API_BASE_URL}/api/mock-chat`,
};

// Debug logging in development
if (__DEV__) {
  console.log('API Configuration:', {
    environment: process.env.NODE_ENV,
    baseUrl: API_BASE_URL,
    endpoints: API_ENDPOINTS
  });
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
};