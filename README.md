# Plateful - Grocery Management App

## 🏗️ Architecture Overview

**Monorepo Structure:**
- `apps/mobile/` - React Native app (Expo)
- `apps/api/` - Serverless API (Vercel)
- `packages/shared/` - Shared types and utilities
- `packages/ui/` - Shared UI components

**Tech Stack:**
- **Mobile**: React Native + Expo Router + Firebase Auth
- **Backend**: Node.js + Vercel Serverless + Firebase Admin
- **Database**: Firestore + Firebase Storage
- **CI/CD**: GitHub Actions + EAS Build + Vercel

## 🚀 Current Deployment Status

### ✅ Production Endpoints
- **API**: `https://plateful-app-eta.vercel.app`
- **EAS Project**: `e1d8f620-391d-4941-84a2-4ebbcbbd7f8e`
- **Package**: `com.kingeli1221.plateful`

### ✅ CI/CD Pipeline Active
- **Feature branches**: Tests + build checks
- **Develop branch**: Preview EAS builds
- **Main branch**: Production builds + Play Store submission

## 🛠️ Development Setup

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Quick Start
```bash
# Install dependencies
npm ci

# Start development servers
npm run dev          # Both API and mobile
npm run mobile       # Mobile only
npm run api         # API only

# Build for production
npm run build
```

### Mobile Development
```bash
cd apps/mobile

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Expo Go
npx expo start
```

## 📱 EAS Build Profiles

### Development
```bash
eas build --platform android --profile development
```
- Development client enabled
- Internal distribution
- APK format for easy testing

### Preview
```bash
eas build --platform android --profile preview
```
- Production-like build
- Internal distribution
- APK format for stakeholder testing

### Production
```bash
eas build --platform android --profile production
```
- App Bundle (AAB) for Play Store
- Auto-increment version
- Production optimizations

## 🔐 Environment Variables

### Vercel (API)
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NODE_ENV=production
```

### Mobile (.env)
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
```

## 🔄 CI/CD Workflow

### GitHub Actions Secrets Required
```
EXPO_TOKEN=your_expo_access_token
GOOGLE_SERVICES_JSON=base64_encoded_google_services_json
FIREBASE_SERVICE_ACCOUNT_KEY=base64_encoded_firebase_key
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=base64_encoded_play_console_key
```

### Automated Triggers
- **Push to feature/***: Run tests + build check
- **Push to develop**: Create preview build
- **Push to main**: Create production build + submit to Play Store

## 📦 Key Commands

### Workspace Management
```bash
npm ci                    # Install all dependencies
npx turbo run build      # Build all packages
npx turbo run type-check # TypeScript validation
```

### EAS Operations
```bash
eas login                # Authenticate with Expo
eas build --platform android --profile preview
eas submit --platform android --latest
eas credentials          # Manage signing certificates
```

### Vercel Operations
```bash
vercel --prod           # Deploy API to production
vercel logs             # View deployment logs
vercel env ls           # List environment variables
```

## 🏪 Play Store Deployment

### Prerequisites
1. Google Play Console account ($25 fee)
2. Service account with Play Developer API access
3. First manual APK upload (required by Google)

### Automated Submission
- Builds automatically submit to **internal testing track**
- Release status: **draft** (requires manual promotion)
- Track progression: internal → alpha → beta → production

## 🔧 Troubleshooting

### Common Issues

**EAS Build Fails:**
```bash
# Clear cache and rebuild
eas build --clear-cache --platform android --profile preview
```

**Workspace Dependencies:**
```bash
# Rebuild shared packages
npx turbo run build --filter=@plateful/shared
npx turbo run build --filter=@plateful/ui
```

**Firebase Connection:**
```bash
# Verify Firebase config
npm run verify:firebase
```

### Debug Commands
```bash
# Check EAS project status
eas project:info

# View build logs
eas build:list
eas build:view [build-id]

# Test API endpoints
curl https://plateful-app-eta.vercel.app/api/health
```

## 📚 Architecture Decisions

### Why Expo + EAS?
- **Simplified builds**: No need for local Android/iOS setup
- **OTA updates**: Push updates without app store review
- **Professional CI/CD**: Enterprise-grade build infrastructure

### Why Vercel for API?
- **Serverless scaling**: Automatic scaling to zero
- **Edge deployment**: Global CDN for low latency
- **Zero config**: Git-based deployments

### Why Monorepo?
- **Shared code**: Types and utilities across mobile/API
- **Atomic deployments**: Deploy related changes together
- **Developer experience**: Single repository, unified tooling

## 🎯 Production Checklist

### Before Going Live
- [ ] All environment variables configured
- [ ] Firebase security rules reviewed
- [ ] API rate limiting implemented
- [ ] Error tracking configured (Sentry/Bugsnag)
- [ ] Analytics implemented
- [ ] App store assets prepared
- [ ] Privacy policy and terms of service

### Monitoring
- **API**: Vercel dashboard + custom monitoring
- **Mobile**: EAS insights + crash reporting
- **CI/CD**: GitHub Actions notifications
- **Play Store**: Google Play Console reviews

---

## 🚀 Ready for Production

This setup provides enterprise-grade CI/CD with:
- ✅ Automated testing and builds
- ✅ Zero-downtime deployments
- ✅ Professional monitoring
- ✅ Rollback capabilities
- ✅ Scalable infrastructure

**Next Steps**: See `TODO.README.md` for current deployment tasks.
