# Production Configuration Templates

This document contains all the configuration files and templates needed for production deployment to the Android Play Store.

## 1. Updated EAS Configuration

Replace your current `apps/mobile/eas.json` with:

```json
{
  "cli": {
    "version": ">= 16.23.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "aab",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

## 2. Updated App Configuration

Replace your current `apps/mobile/app.json` with:

```json
{
  "expo": {
    "name": "Plateful",
    "slug": "plateful",
    "owner": "kingeli1221",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/logo-circle.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/logo-full.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.plateful.app",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/logo-circle.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.plateful.app",
      "versionCode": 1,
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "permissions": [
        "INTERNET",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_NETWORK_STATE"
      ],
      "splash": {
        "image": "./assets/logo-full.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      },
      "googleServicesFile": "./google-services.json",
      "allowBackup": false
    },
    "web": {
      "favicon": "./assets/logo-circle.png"
    },
    "scheme": "plateful",
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.plateful.app"
        }
      ]
    ],
    "extra": {
      "router": {},
      "eas": {
        "projectId": "e1d8f620-391d-4941-84a2-4ebbcbbd7f8e"
      }
    }
  }
}
```

## 3. Environment Variables Setup

Set these environment variables in EAS:

```bash
# API Configuration
eas secret:create --scope project --name API_BASE_URL --value "https://your-vercel-api-domain.vercel.app"

# Firebase Configuration (get these from your Firebase project)
eas secret:create --scope project --name FIREBASE_API_KEY --value "your-firebase-api-key"
eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN --value "your-project.firebaseapp.com"
eas secret:create --scope project --name FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET --value "your-project.appspot.com"
eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID --value "your-sender-id"
eas secret:create --scope project --name FIREBASE_APP_ID --value "your-app-id"

# App Configuration
eas secret:create --scope project --name APP_ENV --value "production"
```

## 4. Firebase Configuration Update

Update your `apps/mobile/src/config/firebase.ts` to use environment variables:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## 5. API Configuration Update

Create or update your API configuration file to handle production URLs:

```typescript
// apps/mobile/src/config/api.ts
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development - use your local API or development server
    return 'http://localhost:3000';
  }
  
  // Production - use your Vercel deployment
  return Constants.expoConfig?.extra?.apiBaseUrl || 'https://your-vercel-api-domain.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/chat`,
  RECIPE: `${API_BASE_URL}/api/recipe`,
  GENERATE_RECIPE: `${API_BASE_URL}/api/generate-recipe`,
  EXTRACT_INTENT: `${API_BASE_URL}/api/extract-intent`,
  HEALTH: `${API_BASE_URL}/api/health`,
};
```

## 6. Package.json Scripts Update

Add these scripts to your `apps/mobile/package.json`:

```json
{
  "scripts": {
    "start": "expo start",
    "dev": "expo start --dev-client",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "build": "expo export",
    "build:android": "eas build --platform android --profile production",
    "build:preview": "eas build --platform android --profile preview",
    "submit:android": "eas submit --platform android --profile production",
    "type-check": "tsc --noEmit",
    "clean": "rimraf .expo"
  }
}
```

## 7. Google Play Console Service Account Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new service account or use existing one
3. Download the JSON key file
4. Save it as `google-play-service-account.json` in your mobile app root
5. Add this file to your `.gitignore`

## 8. Store Listing Information Template

### App Description (Short - 80 characters max)
```
Discover, cook, and share amazing recipes with AI-powered assistance.
```

### App Description (Full - 4000 characters max)
```
Plateful is your ultimate cooking companion that transforms the way you discover, prepare, and enjoy food. Whether you're a beginner cook or a seasoned chef, Plateful makes cooking accessible, fun, and personalized.

🍳 KEY FEATURES:

AI-Powered Recipe Discovery
• Get personalized recipe recommendations based on your preferences
• Smart ingredient substitution suggestions
• Dietary restriction and allergy-friendly options

Interactive Cooking Assistant
• Step-by-step cooking guidance with timers
• Real-time chat support for cooking questions
• Ingredient measurement conversions

Smart Grocery Management
• Automatic shopping list generation from recipes
• Ingredient inventory tracking
• Smart meal planning suggestions

Recipe Collection & Sharing
• Save your favorite recipes
• Create custom recipe collections
• Share recipes with friends and family

🌟 WHY CHOOSE PLATEFUL:

• Intuitive, user-friendly interface
• Works offline for saved recipes
• Regular updates with new features
• Privacy-focused with secure data handling
• Free to use with premium features available

Perfect for:
• Home cooks looking to expand their repertoire
• Busy professionals seeking quick meal solutions
• Food enthusiasts wanting to organize their recipes
• Anyone wanting to improve their cooking skills

Download Plateful today and transform your kitchen into a culinary adventure!

For support, visit: https://plateful.app/support
Privacy Policy: https://plateful.app/privacy
```

### Keywords
```
cooking, recipes, food, kitchen, meal planning, grocery, ingredients, chef, cooking assistant, meal prep
```

## 9. Required Assets Checklist

Ensure you have these assets ready:

- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Phone screenshots (at least 2, max 8)
- [ ] Tablet screenshots (optional but recommended)
- [ ] Privacy policy URL
- [ ] Support/contact URL

## 10. Pre-Launch Testing Checklist

Before submitting to Play Store:

- [ ] Test all core features work
- [ ] Verify API connectivity in production
- [ ] Test Firebase authentication
- [ ] Check app performance and loading times
- [ ] Verify all permissions are necessary
- [ ] Test on different Android versions
- [ ] Check app size and optimization

## Implementation Order

1. Update configuration files (eas.json, app.json)
2. Set up environment variables
3. Update Firebase and API configurations
4. Test build locally
5. Create production build with EAS
6. Set up Google Play Console
7. Upload and test internally
8. Submit for production review