# Android Play Store Deployment Guide for Plateful App

This guide walks you through the complete end-to-end process of deploying your Plateful app to the Android Play Store using EAS (Expo Application Services).

## Current Project Status

✅ **What's Already Set Up:**
- Expo project with React Native app
- EAS project ID configured (`e1d8f620-391d-4941-84a2-4ebbcbbd7f8e`)
- Basic EAS configuration in `eas.json`
- Android package name: `com.plateful.app`
- Firebase integration with Google Services
- API backend deployed on Vercel

## Prerequisites

- Google Play Console account (✅ You have this)
- Node.js and npm installed
- Android development environment (optional for testing)
- $25 Google Play Developer fee (one-time)

## Phase 1: EAS Setup and Configuration

### Step 1: Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### Step 2: Login to EAS
```bash
eas login
```
Use your Expo account credentials (associated with owner: `kingeli1221`)

### Step 3: Verify Project Connection
```bash
cd apps/mobile
eas whoami
eas project:info
```

## Phase 2: Production Build Configuration

### Step 4: Update EAS Configuration

Your current `eas.json` needs enhancement for production builds. Update it with:

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
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Step 5: Update app.json for Production

Enhance your `app.json` with production-ready Android configuration:

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
    "assetBundlePatterns": ["**/*"],
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
        "WRITE_EXTERNAL_STORAGE"
      ],
      "splash": {
        "image": "./assets/logo-full.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      },
      "googleServicesFile": "./google-services.json"
    },
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

## Phase 3: App Signing and Credentials

### Step 6: Configure App Signing Credentials

EAS will handle app signing automatically, but you need to set up credentials:

```bash
eas credentials
```

Choose:
1. Android → Production
2. Select "Set up new keystore"
3. Let EAS generate and manage the keystore

### Step 7: Environment Variables

Set up production environment variables:

```bash
eas secret:create --scope project --name API_BASE_URL --value "https://your-api-domain.vercel.app"
eas secret:create --scope project --name FIREBASE_API_KEY --value "your-firebase-api-key"
```

## Phase 4: Build Process

### Step 8: Create Production Build

```bash
cd apps/mobile
eas build --platform android --profile production
```

This will:
- Create an Android App Bundle (AAB)
- Sign it with your production keystore
- Upload to EAS servers
- Provide download link

### Step 9: Download and Test Build

```bash
# Download the AAB file
eas build:list
# Copy the download URL and download the .aab file
```

## Phase 5: Google Play Console Setup

### Step 10: Create App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in details:
   - App name: "Plateful"
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Declarations: Accept all required declarations

### Step 11: Upload AAB to Internal Testing

1. In Play Console, go to "Release" → "Testing" → "Internal testing"
2. Click "Create new release"
3. Upload your AAB file
4. Add release notes
5. Review and roll out to internal testing

### Step 12: Configure App Information

Complete these sections in Play Console:

**App content:**
- Privacy policy URL
- App category: Food & Drink
- Content rating questionnaire
- Target audience: 13+

**Store listing:**
- App description (short and full)
- Screenshots (phone, tablet)
- Feature graphic
- App icon

## Phase 6: Automated Submission (Optional)

### Step 13: Set Up Service Account for Auto-Submit

1. Create service account in Google Cloud Console
2. Download JSON key file
3. Grant permissions in Play Console
4. Save as `google-play-service-account.json`

```bash
eas submit --platform android --profile production
```

## Phase 7: Publication

### Step 14: Move to Production

1. Test thoroughly in internal testing
2. Move to closed testing (optional)
3. Submit for production review
4. Monitor review status

## Key Commands Reference

```bash
# Build commands
eas build --platform android --profile production
eas build --platform android --profile preview  # For testing

# Submission commands
eas submit --platform android --profile production

# Credential management
eas credentials
eas secret:list

# Project info
eas project:info
eas build:list
```

## Troubleshooting

### Common Issues:

1. **Build fails due to dependencies:**
   - Check package.json for conflicting versions
   - Update Expo SDK if needed

2. **Google Services configuration:**
   - Ensure google-services.json is in the correct location
   - Verify Firebase project configuration

3. **Signing issues:**
   - Use `eas credentials` to reset keystore if needed
   - Ensure consistent package name across configurations

### Build Optimization:

- Use AAB format for smaller download sizes
- Enable ProGuard for code obfuscation
- Optimize images and assets

## Timeline Expectations

- **EAS Build:** 10-20 minutes
- **Google Play Review:** 1-3 days (first submission)
- **Internal Testing Setup:** 1-2 hours
- **Complete Process:** 1-2 days

## Security Checklist

- [ ] Environment variables properly configured
- [ ] API endpoints use HTTPS
- [ ] Firebase security rules configured
- [ ] App permissions minimized
- [ ] ProGuard enabled for production

## Next Steps After Publication

1. Monitor crash reports in Play Console
2. Set up app analytics
3. Plan update deployment strategy
4. Configure automated CI/CD pipeline

---

**Note:** This guide assumes your Vercel API backend is already configured and accessible. Ensure all API endpoints are working before building for production.