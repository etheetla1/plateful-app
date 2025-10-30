# Prompts Used to Build Plateful App

## Overview

This document provides a comprehensive reference of all prompts and commands used to develop, test, launch, and maintain the Plateful grocery management app. Each section contains precise command descriptions and their specific purposes in the development workflow.

The Plateful app is a full-stack React Native application built with:
- **Frontend**: Expo SDK 54 + React Native 0.81
- **Backend**: Firebase (Auth, Firestore, Storage) + Vercel Edge Functions
- **Architecture**: Monorepo with npm workspaces
- **Language**: TypeScript throughout

---

## Table of Contents

1. [Initial Setup & Installation](#initial-setup--installation)
2. [Development Commands](#development-commands)
3. [Testing Commands](#testing-commands)
4. [Build & Deployment](#build--deployment)
5. [Firebase Management](#firebase-management)
6. [Code Quality & Maintenance](#code-quality--maintenance)
7. [Debugging & Troubleshooting](#debugging--troubleshooting)
8. [Backend Hosting & Upgrade](#backend-hosting--upgrade)
9. [Environment Management](#environment-management)
10. [Monitoring & Analytics](#monitoring--analytics)

---

## Initial Setup & Installation

### Project Initialization
```bash
# Clone repository and setup workspace
git clone https://github.com/yourusername/plateful-app.git
cd plateful-app

# Verify npm version (must be 9.0+)
npm --version

# Install all dependencies across monorepo
npm install

# Verify installation success
npm run type-check
```

**Purpose**: Initialize the monorepo workspace and install all dependencies for mobile app, API, and shared packages.

### Environment Configuration
```bash
# Setup mobile app environment
cd apps/mobile
cp .env.example .env
# Edit .env with Firebase configuration keys

# Setup API environment (for backend hosting)
cd ../api
cp .env.example .env.local
# Edit .env.local with Firebase Admin SDK keys

# Return to project root
cd ../..
```

**Purpose**: Configure environment variables for Firebase integration and API keys required for authentication and database access.

---

## Development Commands

### Start Development Environment
```bash
# Start all services simultaneously (recommended)
npm run dev

# Start mobile app only
npm run mobile

# Start API server only
npm run api

# Start with specific platform
cd apps/mobile
npm run android    # Android emulator
npm run ios        # iOS simulator (macOS only)
npm run web        # Web browser
```

**Purpose**: Launch development servers with hot reload for rapid development and testing.

### Development Build (Required for Firebase Auth)
```bash
# Build and install development client
cd apps/mobile
npx expo run:android    # Android device/emulator
npx expo run:ios        # iOS device/simulator

# First build takes 5-10 minutes, subsequent builds are faster
```

**Purpose**: Create development build with native modules required for Firebase Authentication (cannot use Expo Go).

---

## Testing Commands

### Manual Testing
```bash
# Start development server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/chat -X POST -H "Content-Type: application/json" -d '{"message":"test"}'

# Test mobile app on device
# Scan QR code or use development build
```

**Purpose**: Verify API endpoints and mobile app functionality during development.

### Type Checking
```bash
# Check types across all packages
npm run type-check

# Check specific package
npm run type-check --workspace=mobile
npm run type-check --workspace=api
```

**Purpose**: Validate TypeScript types and catch compilation errors before deployment.

### Code Quality
```bash
# Format code with Prettier
npm run format

# Lint code (if configured)
npm run lint

# Clean build artifacts
npm run clean
```

**Purpose**: Maintain code quality and consistency across the codebase.

---

## Build & Deployment

### Mobile App Build (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build profiles
cd apps/mobile
eas build:configure

# Build for development
eas build --platform android --profile development
eas build --platform ios --profile development

# Build for production
eas build --platform android --profile production
eas build --platform ios --profile production

# Build for both platforms
eas build --platform all --profile production
```

**Purpose**: Create production-ready builds for app store distribution or internal testing.

### App Store Submission
```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios

# Check submission status
eas build:list
eas submit:list
```

**Purpose**: Deploy mobile app to app stores for public distribution.

### API Deployment (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy API (first time setup)
cd apps/api
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
vercel logs
```

**Purpose**: Deploy serverless API functions to Vercel for production backend hosting.

---

## Firebase Management

### Firebase CLI Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# List available projects
firebase projects:list

# Set active project
firebase use plateful-mvp
```

**Purpose**: Setup Firebase CLI for managing backend services and security rules.

### Deploy Security Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy both rules
firebase deploy --only firestore:rules,storage:rules

# Deploy with specific project
firebase deploy --only firestore:rules --project plateful-mvp
```

**Purpose**: Update database and storage security rules to control data access permissions.

### Firebase Database Management
```bash
# Export Firestore data
firebase firestore:export gs://plateful-mvp.appspot.com/backups/$(date +%Y%m%d)

# Import Firestore data
firebase firestore:import gs://plateful-mvp.appspot.com/backups/20241029

# Delete collection (use with caution)
firebase firestore:delete --recursive /groceryLists
```

**Purpose**: Backup, restore, and manage Firestore database data.

---

## Code Quality & Maintenance

### Dependency Management
```bash
# Update all dependencies
npm update

# Update specific package
npm update expo --workspace=mobile

# Check for outdated packages
npm outdated

# Audit security vulnerabilities
npm audit
npm audit fix
```

**Purpose**: Keep dependencies up-to-date and secure.

### Code Analysis
```bash
# Bundle analysis (mobile)
cd apps/mobile
npx expo export --dump-assetmap

# Check bundle size
npx expo export --analyze

# Performance profiling
npx expo start --dev-client --profiling
```

**Purpose**: Analyze app performance and bundle size for optimization.

---

## Debugging & Troubleshooting

### Clear Cache and Reset
```bash
# Clear Metro bundler cache
cd apps/mobile
npm run start -- --clear

# Clear Expo cache
rm -rf .expo
npm run clean

# Reset node_modules
rm -rf node_modules
npm install
```

**Purpose**: Resolve caching issues and dependency conflicts.

### Debug Logging
```bash
# Enable Firebase debug logs
# Add to firebase.ts: setLogLevel('debug')

# Enable Metro verbose logging
EXPO_DEBUG=true npm run start

# View Vercel function logs
vercel logs --follow
vercel logs [deployment-url]
```

**Purpose**: Enable detailed logging for debugging issues.

### Common Issue Resolution
```bash
# Fix package manager conflicts
corepack disable
rm -rf node_modules package-lock.json
npm install

# Fix Expo development build issues
npx expo run:android --clear
npx expo run:ios --clear

# Fix Firebase auth issues
# Verify firebase.ts configuration
# Check security rules deployment
```

**Purpose**: Resolve common development and deployment issues.

---

## Backend Hosting & Upgrade

### Current State Assessment
```bash
# Check current backend services
firebase projects:list
vercel ls

# Analyze current architecture
npm run type-check
npm run build

# Review environment variables
cat apps/mobile/.env
cat apps/api/.env.local
```

**Purpose**: Assess current backend setup before upgrading to hosted solution.

### Database Migration Preparation
```bash
# Export current Firestore data
firebase firestore:export gs://plateful-mvp.appspot.com/migration-backup

# Document current schema
# Review firestore.rules for data structure
# List collections and document structure
```

**Purpose**: Prepare for potential database migration or schema changes.

### Production Backend Setup
```bash
# Setup production Firebase project
firebase projects:create plateful-prod

# Configure production environment
cp apps/mobile/.env apps/mobile/.env.prod
cp apps/api/.env.local apps/api/.env.prod

# Deploy to production
firebase use plateful-prod
firebase deploy --only firestore:rules,storage:rules
vercel --prod
```

**Purpose**: Setup separate production environment for hosted backend.

### API Scaling Configuration
```bash
# Configure Vercel for production
# Edit vercel.json for:
# - Function timeout limits
# - Memory allocation
# - Region configuration
# - Environment variables

# Setup monitoring
vercel logs --follow
vercel analytics
```

**Purpose**: Configure API for production-scale traffic and monitoring.

---

## Environment Management

### Environment Switching
```bash
# Switch Firebase projects
firebase use development
firebase use production

# Deploy to specific environment
firebase deploy --project development
firebase deploy --project production

# Vercel environment management
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_PROJECT_ID preview
```

**Purpose**: Manage multiple environments (development, staging, production).

### Configuration Management
```bash
# Validate environment variables
cd apps/mobile && npm run type-check
cd apps/api && npm run type-check

# Test environment connectivity
curl https://your-api.vercel.app/api/health
firebase firestore:get /test/document
```

**Purpose**: Ensure environment configurations are correct and accessible.

---

## Monitoring & Analytics

### Performance Monitoring
```bash
# Setup Firebase Performance Monitoring
# Add to mobile app configuration

# Monitor API performance
vercel analytics
vercel logs --follow

# Monitor build performance
npm run build --verbose
```

**Purpose**: Monitor app and API performance in production.

### Error Tracking
```bash
# Setup error tracking (Sentry, Bugsnag, etc.)
npm install @sentry/react-native

# Configure crash reporting
# Add to app configuration

# Monitor deployment health
vercel logs --since 1h
firebase functions:log
```

**Purpose**: Track and monitor errors in production environment.

### Usage Analytics
```bash
# Setup Firebase Analytics
# Configure in mobile app

# Monitor user engagement
# Firebase Console → Analytics

# API usage monitoring
# Vercel Dashboard → Analytics
```

**Purpose**: Track user engagement and API usage patterns.

---

## Key Management & Security

### API Key Rotation
```bash
# Generate new Firebase API keys
# Firebase Console → Project Settings → General

# Update environment variables
# Edit .env files with new keys

# Redeploy with new keys
npm run build
vercel --prod
```

**Purpose**: Rotate API keys for security maintenance.

### Security Audit
```bash
# Audit npm dependencies
npm audit

# Check Firebase security rules
firebase firestore:rules:get
firebase storage:rules:get

# Validate API security
# Review vercel.json configuration
# Check environment variable exposure
```

**Purpose**: Ensure application security and compliance.

---

## Notes for Hosted Backend Upgrade

### Current Architecture
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Cloud Storage
- **API**: Vercel Edge Functions
- **Frontend**: Expo React Native

### Upgrade Considerations
1. **Database Scaling**: Consider Firestore limits and pricing
2. **API Performance**: Monitor Vercel function cold starts
3. **Authentication**: Maintain Firebase Auth for seamless user experience
4. **Storage**: Evaluate Cloud Storage vs CDN for assets
5. **Monitoring**: Implement comprehensive logging and analytics

### Migration Strategy
1. **Phase 1**: Setup production Firebase project
2. **Phase 2**: Deploy API to Vercel with production configuration
3. **Phase 3**: Migrate data and test thoroughly
4. **Phase 4**: Update mobile app to use production endpoints
5. **Phase 5**: Monitor and optimize performance

---

## Quick Reference Commands

### Daily Development
```bash
npm run dev                    # Start all services
npm run type-check            # Validate types
npm run format                # Format code
git add . && git commit -m "feat: description"
```

### Testing & Debugging
```bash
npm run start -- --clear      # Clear cache and start
curl http://localhost:3000/api/health  # Test API
npx expo run:android          # Build development client
```

### Deployment
```bash
eas build --platform all --profile production  # Build mobile app
vercel --prod                 # Deploy API
firebase deploy --only firestore:rules         # Deploy security rules
```

### Maintenance
```bash
npm update                    # Update dependencies
npm audit fix                 # Fix security issues
firebase firestore:export    # Backup data
```

This document serves as the definitive reference for all development, testing, and deployment operations for the Plateful app. Keep this updated as new features and deployment strategies are implemented.