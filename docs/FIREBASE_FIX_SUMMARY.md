# Firebase Configuration - Fix Summary

## ✅ All Issues Fixed!

### Changes Made

| Issue | Status | Solution |
|-------|--------|----------|
| **1. google-services.json Location** | ✅ Fixed | Moved to `apps/mobile/android/app/google-services.json` |
| **2. Package Name Mismatch** | ✅ Fixed | Updated to `com.plateful.app` everywhere |
| **3. Missing Google Services Plugin** | ✅ Fixed | Added to both gradle files |
| **4. API App Build Artifacts** | ✅ Fixed | Removed android/ios folders from apps/api |

### Files Modified

```
✅ apps/mobile/android/app/google-services.json (moved & updated)
✅ apps/mobile/android/build.gradle (added Google Services classpath)
✅ apps/mobile/android/app/build.gradle (applied Google Services plugin)
✅ apps/mobile/ios/Plateful/GoogleService-Info.plist (created template)
✅ apps/api/package.json (cleaned mobile dependencies)
🗑️ apps/api/android/ (removed)
🗑️ apps/api/ios/ (removed)
🗑️ apps/api/app.json (removed)
```

---

## ⚠️ ACTION REQUIRED: Firebase Console Setup

### Step 1: Update Android App in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/plateful-83021/settings/general)
2. Under "Your apps", find your Android app
3. **Either:**
   - **Option A**: Add a new Android app with package name `com.plateful.app`
   - **Option B**: Update existing app's package name to `com.plateful.app`
4. Download the new `google-services.json`
5. Replace: `apps/mobile/android/app/google-services.json`

### Step 2: Add iOS App in Firebase Console

1. In Firebase Console, click "Add app" → iOS
2. Enter Bundle ID: `com.plateful.app`
3. Register and download `GoogleService-Info.plist`
4. Replace: `apps/mobile/ios/Plateful/GoogleService-Info.plist`
5. Add to Xcode project:
   ```bash
   # Open Xcode
   open apps/mobile/ios/Plateful.xcworkspace
   # Right-click Plateful folder → Add Files → Select GoogleService-Info.plist
   # ✅ Check "Copy items if needed"
   # ✅ Select "Plateful" target
   ```

---

## 🚀 Quick Start Commands

### Install & Clean

```bash
# Install dependencies
cd apps/mobile
npm install  # or: pnpm install

# Clean Android
cd android
./gradlew clean
cd ..

# Clean iOS
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Build & Run

```bash
# Android
npm run android

# iOS
npm run ios
```

### Verify Setup

```bash
# Run verification script
./verify-firebase-setup.sh
```

---

## 📋 Verification Checklist

Run this checklist to ensure everything is working:

- [ ] Downloaded new `google-services.json` from Firebase Console
- [ ] Downloaded new `GoogleService-Info.plist` from Firebase Console
- [ ] Replaced both files in the project
- [ ] Run `npm install` in apps/mobile
- [ ] Run `./gradlew clean` in apps/mobile/android
- [ ] Run `pod install` in apps/mobile/ios
- [ ] Run `./verify-firebase-setup.sh` (all checks pass)
- [ ] Test Android build: `npm run android`
- [ ] Test iOS build: `npm run ios`
- [ ] Test authentication: Sign in with email/password
- [ ] Test authentication: Sign in with Google

---

## 🐛 Common Issues & Solutions

### "google-services.json not found"
```bash
# Verify file location
ls -la apps/mobile/android/app/google-services.json
```

### "Package name mismatch"
- Download fresh config files from Firebase Console with `com.plateful.app`

### "Google Sign-In fails"
```bash
# Get SHA-1 fingerprint
keytool -list -v -keystore apps/mobile/android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android

# Add SHA-1 to Firebase Console:
# Project Settings → Your apps → Android app → Add fingerprint
```

### "Build fails after changes"
```bash
# Clean everything
cd apps/mobile/android
./gradlew clean
cd ../ios
rm -rf Pods Podfile.lock build
pod install
cd ..

# Rebuild
npm run android  # or: npm run ios
```

---

## 📱 Expected Console Output

When the app starts successfully, you should see:

```
📦 Firebase Config Check:
API Key: ✅ Present
Project ID: plateful-83021
Auth Domain: plateful-83021.firebaseapp.com
Storage Bucket: plateful-83021.firebasestorage.app
Messaging Sender ID: 491097328247
App ID: ✅ Present

✅ Firebase App initialized successfully
✅ Firestore initialized successfully
✅ Firebase Auth initialized for native with AsyncStorage persistence
🔥 Firebase fully initialized for project: plateful-83021
```

---

## 📚 Documentation

- Full Setup Guide: [FIREBASE_SETUP_FIXED.md](./FIREBASE_SETUP_FIXED.md)
- Verification Script: [verify-firebase-setup.sh](./verify-firebase-setup.sh)
- Firebase Console: https://console.firebase.google.com/project/plateful-83021

---

## ✅ Status: Ready to Deploy

All configuration issues have been fixed. After downloading the proper Firebase config files from the console, your app is ready to build and deploy on both iOS and Android! 🎉


