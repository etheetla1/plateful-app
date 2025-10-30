# 🍎 iOS Firebase Setup - Step by Step Instructions

## 🚨 CURRENT ISSUE

Your iOS app has a **PLACEHOLDER** Firebase App ID and won't work in production.

Run this to verify:
```bash
./verify-firebase-config.sh
```

Expected error:
```
✗ iOS GoogleService-Info.plist contains PLACEHOLDER
  <string>1:491097328247:ios:PLACEHOLDER_IOS_APP_ID</string>
```

---

## ✅ FIX: Register iOS App in Firebase Console

### Step 1: Open Firebase Console

1. Go to: https://console.firebase.google.com/project/plateful-83021/overview
2. Sign in with your Google account

### Step 2: Check if iOS App Exists

Look at the top of the page under "Your apps":
- If you see an **iOS icon** - the app might already exist (skip to Step 3)
- If you only see **Android icon** - you need to add iOS (continue to Step 2A)

#### Step 2A: Add New iOS App (if doesn't exist)

1. Click **"Add app"** button
2. Select the **iOS** icon
3. Fill in:
   - **iOS bundle ID**: `com.plateful.app` (EXACTLY this)
   - **App nickname (optional)**: `Plateful iOS`
   - **App Store ID (optional)**: Leave blank for now
4. Click **"Register app"**
5. **Download GoogleService-Info.plist** (important!)
6. Click **"Next"** → **"Next"** → **"Continue to console"** (skip SDK steps)

#### Step 2B: Download Existing iOS App Config

If the iOS app already exists:
1. Click on the **Settings gear icon** (⚙️) → **Project settings**
2. Scroll down to **"Your apps"** section
3. Find the iOS app with Bundle ID: `com.plateful.app`
4. Click **"GoogleService-Info.plist"** download button

### Step 3: Backup Current File

Before replacing, backup the placeholder file:

```bash
cd apps/mobile/ios/Plateful
cp GoogleService-Info.plist GoogleService-Info.plist.backup
```

### Step 4: Replace the File

**Option A: Using Finder**
1. Open Finder
2. Navigate to your Downloads folder
3. Find `GoogleService-Info.plist`
4. Drag it to: `apps/mobile/ios/Plateful/`
5. When asked, click **"Replace"**

**Option B: Using Terminal**
```bash
# From project root
mv ~/Downloads/GoogleService-Info.plist apps/mobile/ios/Plateful/GoogleService-Info.plist
```

### Step 5: Verify the New File

Check that the placeholder is gone:

```bash
cd apps/mobile/ios/Plateful
grep "GOOGLE_APP_ID" GoogleService-Info.plist
```

**Should see** (with actual ID, not PLACEHOLDER):
```xml
<key>GOOGLE_APP_ID</key>
<string>1:491097328247:ios:abc123def456789</string>
```

**Should NOT see**:
```xml
<string>1:491097328247:ios:PLACEHOLDER_IOS_APP_ID</string>
```

### Step 6: Run Verification Script

From project root:
```bash
./verify-firebase-config.sh
```

**Expected output:**
```
✓ iOS GoogleService-Info.plist has no placeholders
✓ All checks passed! Firebase is configured correctly.
```

### Step 7: Rebuild iOS App

Clean and rebuild:
```bash
cd apps/mobile

# Clean build folders
npx expo prebuild --clean

# Run on iOS simulator
npx expo run:ios

# OR run on physical device
npx expo run:ios --device
```

### Step 8: Test Firebase Connection

After the app launches, check Metro console for:

```
✅ Firebase App initialized successfully
✅ Firestore initialized successfully
✅ Firebase Auth initialized for native with AsyncStorage persistence
🔥 Firebase fully initialized for project: plateful-83021
```

---

## 🧪 Test Firebase Features

### Test 1: Check Firebase SDK

In your app, you should see no Firebase errors in the console.

### Test 2: Try Sign In

1. Navigate to the sign-in screen
2. Try email/password sign-in
3. Check for any Firebase errors

### Test 3: Try Google Sign-In (Advanced)

Google Sign-In on iOS requires additional setup:

#### Additional iOS Google Sign-In Setup

1. **Add URL Scheme** (Already configured in your app!)
   - Check `apps/mobile/ios/Plateful/Info.plist`
   - Should have `REVERSED_CLIENT_ID` from GoogleService-Info.plist

2. **Verify URL Scheme**:
```bash
grep -A 10 "CFBundleURLTypes" apps/mobile/ios/Plateful/Info.plist
```

Should include:
```xml
<string>com.googleusercontent.apps.491097328247-v3s2bmjvmh2f5tsc9kcmffn0thcqnf3o</string>
```

3. **Test Google Sign-In**:
   - Tap "Sign in with Google"
   - Should open Google's login page
   - After login, should redirect back to app

---

## 🔍 Understanding the Files

### What is `GoogleService-Info.plist`?

This file contains:
- **API Key**: Identifies your Firebase project to iOS
- **Project ID**: Your Firebase project (`plateful-83021`)
- **Bundle ID**: Your app identifier (`com.plateful.app`)
- **Google App ID**: Unique ID for this iOS app in Firebase
- **Client ID**: For Google Sign-In on iOS
- **Reversed Client ID**: For OAuth redirects

### Why Does iOS Need a Separate File?

Firebase has different apps for each platform:
- **Android**: Uses `google-services.json` (processed at build time)
- **iOS**: Uses `GoogleService-Info.plist` (read at runtime)
- **Web**: Uses JavaScript config (from environment variables)

Each platform gets a unique App ID from Firebase, even though they share the same Firebase project.

### Current File Locations

```
apps/mobile/
├── android/
│   └── app/
│       └── google-services.json          ← Android config (JSON)
├── ios/
│   └── Plateful/
│       └── GoogleService-Info.plist      ← iOS config (XML/Plist)
└── src/
    └── config/
        └── firebase.ts                    ← Initializes Firebase SDK
```

---

## ⚠️ Common Issues

### Issue: "File not found: GoogleService-Info.plist"

**Solution**: Make sure the file is in the correct location:
```
apps/mobile/ios/Plateful/GoogleService-Info.plist
```

NOT in:
- `apps/mobile/GoogleService-Info.plist`
- `apps/mobile/ios/GoogleService-Info.plist`
- `ios/GoogleService-Info.plist`

### Issue: Still seeing PLACEHOLDER after downloading

**Reasons**:
1. You downloaded the wrong file (Android instead of iOS)
2. You didn't replace the old file
3. iOS app wasn't actually registered in Firebase

**Solution**: 
1. Check the file content: `cat apps/mobile/ios/Plateful/GoogleService-Info.plist`
2. Look for `<key>GOOGLE_APP_ID</key>` - next line should NOT say PLACEHOLDER
3. If still PLACEHOLDER, re-download from Firebase Console

### Issue: "The app identifier does not match"

**Solution**: 
- Verify Bundle ID in Firebase Console is **exactly** `com.plateful.app`
- Case-sensitive!
- No extra spaces

### Issue: Build fails after replacing file

**Try**:
```bash
cd apps/mobile

# Clean everything
npx expo prebuild --clean
rm -rf ios/Pods ios/Podfile.lock

# Reinstall pods
cd ios
pod install
cd ..

# Rebuild
npx expo run:ios
```

---

## 📋 Checklist

After following these steps, you should have:

- [ ] Downloaded `GoogleService-Info.plist` from Firebase Console
- [ ] Backed up old file (optional but recommended)
- [ ] Replaced the file in `apps/mobile/ios/Plateful/`
- [ ] Verified no PLACEHOLDER in the new file
- [ ] Ran `./verify-firebase-config.sh` successfully
- [ ] Rebuilt iOS app with `npx expo prebuild --clean`
- [ ] Launched app and checked Firebase logs
- [ ] Tested sign-in functionality
- [ ] No Firebase errors in console

---

## 🎯 Next Steps After iOS is Fixed

Once iOS Firebase is configured:

1. **Test both platforms**:
   ```bash
   # Test Android
   npx expo run:android
   
   # Test iOS
   npx expo run:ios
   ```

2. **Set up Firebase Security Rules** (if not done):
   - See `firestore.rules` and `storage.rules`
   - Deploy: `firebase deploy --only firestore:rules,storage`

3. **Add Firebase Analytics (optional)**:
   - Already included in GoogleService-Info.plist
   - Just import and use: `import { getAnalytics } from 'firebase/analytics'`

4. **Configure Push Notifications (optional)**:
   - iOS: Need APNs certificate
   - Android: Firebase Cloud Messaging works out of the box

---

**Last Updated**: 2025-10-30  
**Status**: Waiting for user to download iOS config from Firebase Console


