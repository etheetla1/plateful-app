# Firebase Setup - Quick Reference Card

## 📋 What Was Fixed

| # | Issue | Status |
|---|-------|--------|
| 1 | google-services.json in wrong location | ✅ Fixed |
| 2 | Package name mismatch | ✅ Fixed |
| 3 | Missing Google Services plugin | ✅ Fixed |
| 4 | API folder had mobile artifacts | ✅ Fixed |

## 🎯 Current Package Name (Everywhere)

```
com.plateful.app
```

## 📁 File Locations

```
✅ apps/mobile/android/app/google-services.json
✅ apps/mobile/ios/Plateful/GoogleService-Info.plist
```

## ⚠️ TODO: Download from Firebase Console

### Android
1. Firebase Console → Project Settings → Your apps → Android
2. Add new app: `com.plateful.app`
3. Download `google-services.json`
4. Replace: `apps/mobile/android/app/google-services.json`

### iOS
1. Firebase Console → Add app → iOS
2. Bundle ID: `com.plateful.app`
3. Download `GoogleService-Info.plist`
4. Replace: `apps/mobile/ios/Plateful/GoogleService-Info.plist`
5. Add to Xcode (right-click → Add Files)

## 🚀 Quick Start

```bash
# 1. Verify fixes
./verify-firebase-setup.sh

# 2. Install deps
cd apps/mobile && npm install

# 3. Clean Android
cd android && ./gradlew clean && cd ..

# 4. Clean iOS
cd ios && pod install && cd ..

# 5. Run
npm run android  # or: npm run ios
```

## 🐛 Troubleshooting

### Build fails?
```bash
cd apps/mobile/android && ./gradlew clean && cd ../..
cd apps/mobile/ios && rm -rf Pods Podfile.lock && pod install && cd ../..
```

### Google Sign-In fails?
```bash
# Get debug keystore SHA-1
keytool -list -v -keystore apps/mobile/android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android

# Add to: Firebase Console → Android app → Add fingerprint
```

## 📚 Documentation

- **Full Guide**: [FIREBASE_SETUP_FIXED.md](./FIREBASE_SETUP_FIXED.md)
- **Before/After**: [BEFORE_AFTER_COMPARISON.md](./BEFORE_AFTER_COMPARISON.md)
- **Summary**: [FIREBASE_FIX_SUMMARY.md](./FIREBASE_FIX_SUMMARY.md)
- **Console**: https://console.firebase.google.com/project/plateful-83021

## ✅ Checklist

- [ ] Run `./verify-firebase-setup.sh` (all green)
- [ ] Download new `google-services.json`
- [ ] Download new `GoogleService-Info.plist`
- [ ] Replace both files
- [ ] Run `npm install`
- [ ] Run `./gradlew clean` (Android)
- [ ] Run `pod install` (iOS)
- [ ] Test Android build
- [ ] Test iOS build
- [ ] Test email sign-in
- [ ] Test Google sign-in

## 🎉 You're All Set!

Once you download the Firebase config files with the correct package name (`com.plateful.app`), everything will work! 🚀


