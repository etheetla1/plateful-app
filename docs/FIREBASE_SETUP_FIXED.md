# Firebase Setup - Issues Fixed ✅

## Summary of Fixes

All four critical issues have been resolved:

### ✅ Issue 1: google-services.json Location
- **Fixed**: Moved from `apps/mobile/app/google-services.json`
- **To**: `apps/mobile/android/app/google-services.json`

### ✅ Issue 2: Package Name Mismatch
- **Updated**: Package name in google-services.json changed from `com.kingeli1221.plateful` to `com.plateful.app`
- **Consistent with**: app.json bundleIdentifier and build.gradle applicationId

### ✅ Issue 3: Google Services Gradle Plugin
- **Added**: Google Services plugin classpath to `apps/mobile/android/build.gradle`
- **Applied**: Plugin in `apps/mobile/android/app/build.gradle`

### ✅ Issue 4: API App Build Artifacts
- **Removed**: `apps/api/android/` and `apps/api/ios/` directories
- **Cleaned**: Removed mobile-related dependencies (expo, react-native) from `apps/api/package.json`
- **Removed**: Mobile build scripts (android, ios) from `apps/api/package.json`

---

## ⚠️ IMPORTANT: Firebase Console Configuration Required

### Android Configuration

You need to register the new package name in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `plateful-83021`
3. Navigate to **Project Settings** → **Your apps**
4. For the Android app:
   - Either **add a new Android app** with package name `com.plateful.app`
   - Or **update the existing app** to use `com.plateful.app`
5. **Download the new `google-services.json`** file
6. Replace the file at: `apps/mobile/android/app/google-services.json`

### iOS Configuration

You need to add an iOS app in Firebase Console:

1. In Firebase Console, go to **Project Settings** → **Your apps**
2. Click **Add app** → **iOS**
3. Enter Bundle ID: `com.plateful.app`
4. Register the app and **download `GoogleService-Info.plist`**
5. Replace the file at: `apps/mobile/ios/Plateful/GoogleService-Info.plist`
6. Make sure to add it to your Xcode project:
   - Open Xcode project
   - Right-click on the Plateful folder
   - Select "Add Files to Plateful..."
   - Select the `GoogleService-Info.plist` file
   - ✅ Check "Copy items if needed"
   - ✅ Make sure "Plateful" target is selected

---

## File Structure (After Fixes)

```
plateful-app/
├── apps/
│   ├── mobile/
│   │   ├── android/
│   │   │   └── app/
│   │   │       └── google-services.json ✅ (Moved here)
│   │   ├── ios/
│   │   │   └── Plateful/
│   │   │       └── GoogleService-Info.plist ✅ (Created, needs proper file from Firebase)
│   │   └── app.json (package: com.plateful.app)
│   └── api/ ✅ (Cleaned - no android/ios folders)
```

---

## Gradle Configuration Changes

### Root build.gradle (`apps/mobile/android/build.gradle`)

```gradle
dependencies {
  classpath('com.android.tools.build:gradle')
  classpath('com.facebook.react:react-native-gradle-plugin')
  classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  classpath('com.google.gms:google-services:4.4.0') // ✅ Added
}
```

### App build.gradle (`apps/mobile/android/app/build.gradle`)

```gradle
// ... existing configuration ...

// Apply Google Services plugin at the bottom
apply plugin: 'com.google.gms.google-services' // ✅ Added
```

---

## Verification Steps

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
# or
pnpm install
```

### 2. Clean Build Artifacts

**Android:**
```bash
cd apps/mobile/android
./gradlew clean
cd ..
```

**iOS:**
```bash
cd apps/mobile/ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### 3. Verify Package Names

**Check Android:**
```bash
# Verify package name in google-services.json
cat apps/mobile/android/app/google-services.json | grep package_name
# Should output: "package_name": "com.plateful.app"
```

**Check iOS:**
```bash
# Verify bundle identifier in GoogleService-Info.plist
grep -A 1 "BUNDLE_ID" apps/mobile/ios/Plateful/GoogleService-Info.plist
# Should output: <string>com.plateful.app</string>
```

### 4. Build and Test

**Android:**
```bash
cd apps/mobile
npm run android
# or
pnpm android
```

**iOS:**
```bash
cd apps/mobile
npm run ios
# or
pnpm ios
```

### 5. Test Firebase Authentication

Once the app is running, test the authentication flow:

1. Open the Sign In screen
2. Try signing in with email/password
3. Try signing in with Google
4. Check the console logs for Firebase initialization messages:
   - ✅ "Firebase App initialized successfully"
   - ✅ "Firestore initialized successfully"
   - ✅ "Firebase Auth initialized"

---

## Troubleshooting

### Android Build Fails with "google-services.json not found"

**Cause**: The file is not in the correct location.

**Solution**:
```bash
# Verify the file exists
ls -la apps/mobile/android/app/google-services.json

# If missing, download from Firebase Console and place it there
```

### iOS Build Fails with "GoogleService-Info.plist not found"

**Cause**: The file is not added to the Xcode project.

**Solution**:
1. Download the proper file from Firebase Console
2. Open Xcode
3. Right-click on Plateful folder in Project Navigator
4. Select "Add Files to Plateful..."
5. Select GoogleService-Info.plist
6. Make sure "Copy items if needed" is checked
7. Make sure "Plateful" target is selected

### Package Name Mismatch Errors

**Cause**: The Firebase Console configuration doesn't match your app's package name.

**Solution**:
1. Verify app.json has correct package names:
   - Android: `"package": "com.plateful.app"`
   - iOS: `"bundleIdentifier": "com.plateful.app"`
2. Download fresh config files from Firebase Console with matching package name
3. Clean and rebuild

### Google Sign-In Not Working

**Cause**: OAuth client IDs may need to be regenerated for the new package name.

**Solution**:
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Select **Google** provider
3. Verify the OAuth client IDs are correct
4. For Android: Add SHA-1 fingerprint of your debug keystore
   ```bash
   keytool -list -v -keystore apps/mobile/android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
5. Add the SHA-1 to Firebase Console under Project Settings → Your apps → Android app

---

## Environment Variables

Make sure you have a `.env` file in `apps/mobile/` with the following:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAvQMY8Cn01dH1S3KTHtLBa5V57s2fuFAg
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=plateful-83021.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=plateful-83021
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=plateful-83021.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=491097328247
EXPO_PUBLIC_FIREBASE_APP_ID=<your-android-app-id>
EXPO_PUBLIC_FIREBASE_APP_ID_IOS=<your-ios-app-id>
```

**Note**: Update the APP_IDs after registering your apps in Firebase Console with the correct package names.

---

## Next Steps

1. ✅ Download fresh `google-services.json` from Firebase Console (Android)
2. ✅ Download fresh `GoogleService-Info.plist` from Firebase Console (iOS)
3. ✅ Replace both files in your project
4. ✅ Clean build artifacts
5. ✅ Rebuild for both platforms
6. ✅ Test authentication flows

---

## Status

- [x] google-services.json moved to correct location
- [x] Package name updated in configuration files
- [x] Google Services Gradle plugin added
- [x] API folder cleaned of mobile artifacts
- [x] iOS GoogleService-Info.plist template created
- [ ] **YOU NEED TO DO**: Download proper config files from Firebase Console
- [ ] **YOU NEED TO DO**: Test on Android device/emulator
- [ ] **YOU NEED TO DO**: Test on iOS device/simulator

---

## Contact

If you encounter any issues, check the Firebase Console logs and the app's console output for detailed error messages.


