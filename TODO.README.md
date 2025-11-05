# 🎯 TODO: Plateful App Deployment Tasks

## 📋 Current Mission
Deploy Plateful app to Play Store with add-profiles branch integration and 24/7 CI/CD automation.

**Priority**: Branch merge first → API keys → EAS builds → Play Store CI/CD

---

## 🚀 PHASE 1: Pull add-profiles Branch (PRIORITY 1)

### Current Status
- ✅ Main branch has excellent CI/CD setup
- ❌ add-profiles branch exists on GitHub but not pulled locally
- ❌ Need to merge without breaking existing CI/CD

### Steps to Execute

#### 1. Fetch Remote Branch
```bash
# Check current branch and status
git status
git branch -a

# Fetch all remote branches
git fetch origin

# Verify add-profiles exists
git branch -r | grep add-profiles

# Create local tracking branch
git checkout -b add-profiles origin/add-profiles
```

#### 2. Analyze What's Different
```bash
# See commit differences
git log --oneline main..add-profiles

# See file differences
git diff main..add-profiles --name-only

# See specific changes in key files
git diff main..add-profiles -- apps/mobile/app.json
git diff main..add-profiles -- package.json
```

#### 3. Safe Merge Strategy
```bash
# Create backup branch first
git checkout main
git checkout -b backup-before-merge-$(date +%Y%m%d)
git push origin backup-before-merge-$(date +%Y%m%d)

# Merge add-profiles into main
git checkout main
git merge add-profiles --no-ff -m "feat: integrate add-profiles features"

# If conflicts occur:
# KEEP: .github/, apps/mobile/eas.json, package IDs in app.json
# ACCEPT: New features, components, dependencies
# MERGE: package.json dependencies
```

#### 4. Post-Merge Verification
```bash
# Rebuild workspace
npm ci
npx turbo run build

# Verify mobile app
cd apps/mobile
npm run type-check
eas build --platform android --profile preview --dry-run
```

---

## 🔧 PHASE 2: Vercel API Keys Configuration

### Current Status
- ✅ API deployed at `https://plateful-app-eta.vercel.app`
- ❌ Production environment variables need verification
- ❌ Firebase service account key needs setup

### Required Environment Variables

#### In Vercel Dashboard (vercel.com/dashboard)
Navigate to: **Your Project → Settings → Environment Variables**

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Environment
NODE_ENV=production
```

#### How to Get Firebase Service Account Key
```bash
# 1. Go to Firebase Console → Project Settings → Service Accounts
# 2. Click "Generate new private key"
# 3. Download JSON file
# 4. Extract values for Vercel environment variables
```

#### Test API After Configuration
```bash
# Health check
curl https://plateful-app-eta.vercel.app/api/health

# Recipe endpoint
curl https://plateful-app-eta.vercel.app/api/recipe

# Chat endpoint (if exists)
curl -X POST https://plateful-app-eta.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

---

## 📱 PHASE 3: EAS Build Configuration

### Current Status
- ✅ EAS project configured: `e1d8f620-391d-4941-84a2-4ebbcbbd7f8e`
- ✅ Build profiles defined in eas.json
- ❌ Need to verify API URL in build environment
- ❌ Need to test builds with merged features

### Steps to Execute

#### 1. Update EAS Configuration
Verify `apps/mobile/eas.json` has correct API URL:
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://plateful-app-eta.vercel.app"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://plateful-app-eta.vercel.app"
      }
    }
  }
}
```

#### 2. Test Preview Build
```bash
cd apps/mobile

# Login to EAS (if not already)
eas login

# Verify project connection
eas project:info

# Create preview build
eas build --platform android --profile preview
```

#### 3. Test on Mac
```bash
# Option 1: Download APK from EAS dashboard and install on Android device/emulator

# Option 2: Development build for testing
eas build --platform android --profile development

# Option 3: Local development
npx expo start
# Scan QR with Expo Go app
```

---

## 🏪 PHASE 4: Play Store CI/CD Setup

### Current Status
- ✅ GitHub Actions workflows exist
- ❌ GitHub secrets need configuration
- ❌ Google Play Console account needed
- ❌ Service account for automated submission needed

### GitHub Actions Secrets Required

#### In GitHub Repository Settings
Navigate to: **Settings → Secrets and variables → Actions**

Add these secrets:
```
EXPO_TOKEN=your_expo_access_token
GOOGLE_SERVICES_JSON=base64_encoded_google_services_json
FIREBASE_SERVICE_ACCOUNT_KEY=base64_encoded_firebase_service_account
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=base64_encoded_play_console_service_account
```

#### How to Get Expo Token
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login
eas login

# Get token from: https://expo.dev/accounts/[username]/settings/access-tokens
# Create new token, copy value
```

#### How to Get Base64 Encoded Files
```bash
# For google-services.json
base64 -i apps/mobile/google-services.json

# For Firebase service account JSON
base64 -i path/to/firebase-service-account.json

# For Play Console service account JSON
base64 -i path/to/google-play-service-account.json
```

### Google Play Console Setup

#### 1. Create Developer Account
- Go to [Google Play Console](https://play.google.com/console)
- Pay $25 one-time registration fee
- Complete developer profile

#### 2. Create Service Account
```bash
# 1. Go to Google Cloud Console
# 2. Create new project or select existing
# 3. Enable "Google Play Developer API"
# 4. Create service account with roles:
#    - Service Account User
#    - Google Play Developer API access
# 5. Download JSON key file
```

#### 3. Configure Play Console Permissions
- In Play Console: **Setup → API access**
- Link Google Cloud project
- Grant permissions to service account

#### 4. First Manual Upload (Required)
```bash
cd apps/mobile

# Create production build
eas build --platform android --profile production

# Wait for build, then manually upload AAB to Play Console
# This is required for the first release
```

---

## 🔄 PHASE 5: Test Complete CI/CD Flow

### Automated Workflow Test
```bash
# Make test change
echo "# CI/CD Test $(date)" >> test-cicd.md
git add test-cicd.md
git commit -m "test: verify complete CI/CD pipeline"

# Test develop branch (preview build)
git checkout develop
git merge main
git push origin develop

# Test main branch (production build + Play Store)
git checkout main
git push origin main
```

### Monitor Deployments
- **GitHub Actions**: Check Actions tab for workflow status
- **EAS Dashboard**: Monitor build progress
- **Vercel Dashboard**: Verify API deployments
- **Play Console**: Check app submissions

---

## ⚠️ Critical Files to Preserve During Merge

### DO NOT OVERWRITE (Our CI/CD work):
- `.github/workflows/mobile-cicd.yml`
- `.github/workflows/mobile-feature.yml`
- `apps/mobile/eas.json`
- `apps/mobile/app.json` (package IDs: `com.kingeli1221.plateful`)
- `vercel.json`
- `turbo.json`

### ACCEPT FROM add-profiles:
- New app screens/components
- New features and functionality
- Additional dependencies
- New API endpoints

---

## 🚨 Emergency Rollback

### If Merge Goes Wrong
```bash
# Reset to backup
git reset --hard backup-before-merge-$(date +%Y%m%d)
git push origin main --force
```

### If Build Fails
```bash
# Clear EAS cache
eas build --clear-cache --platform android --profile preview

# Rebuild workspace
npm ci
npx turbo run build --force
```

---

## 📊 Success Metrics

### Phase 1 Complete When:
- [ ] add-profiles branch merged successfully
- [ ] No conflicts in CI/CD files
- [ ] App builds locally: `npm run mobile`
- [ ] TypeScript passes: `npm run type-check`

### Phase 2 Complete When:
- [ ] All Vercel environment variables set
- [ ] API health check returns 200
- [ ] Firebase connection working

### Phase 3 Complete When:
- [ ] EAS preview build succeeds
- [ ] APK installs and runs on device
- [ ] All merged features working

### Phase 4 Complete When:
- [ ] GitHub Actions secrets configured
- [ ] Google Play Console account active
- [ ] Service account permissions granted
- [ ] First manual upload successful

### Phase 5 Complete When:
- [ ] Push to develop triggers preview build
- [ ] Push to main triggers production build + submission
- [ ] App appears in Play Console internal testing

---

## 🎯 Next Actions (In Order)

1. **START HERE**: Execute Phase 1 - Pull and merge add-profiles branch
2. **THEN**: Verify/configure Vercel API keys (Phase 2)
3. **THEN**: Test EAS builds with merged code (Phase 3)
4. **THEN**: Set up Play Store automation (Phase 4)
5. **FINALLY**: Test complete CI/CD flow (Phase 5)

**Estimated Time**: 2-3 hours total
**Risk Level**: Low (comprehensive backup strategy)
**Complexity**: Medium (well-documented steps)

---

## 💡 Pro Tips from 10+ Years React Native

### Branch Merge Strategy
- Always create backup branches before major merges
- Use `--no-ff` to preserve merge history
- Test builds immediately after merge
- Keep package IDs consistent across branches

### EAS Build Optimization
- Use preview builds for testing, production for store
- Clear cache if builds fail mysteriously
- Monitor build times - should be <15 minutes
- Keep eas.json minimal and focused

### CI/CD Best Practices
- Test locally before pushing to CI
- Use semantic commit messages for better tracking
- Monitor GitHub Actions usage (free tier limits)
- Set up Slack/Discord notifications for build status

### Play Store Deployment
- Always test on internal track first
- Use staged rollouts for production releases
- Monitor crash reports and user feedback
- Keep release notes updated and professional

**Ready to execute Phase 1! 🚀**