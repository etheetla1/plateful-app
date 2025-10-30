# 🚀 Quick Start - Firebase Configuration

## ⚡ TL;DR - What You Need To Do RIGHT NOW

### 1. Verify Current Status
```bash
npm run verify:firebase
```

**Expected result**: Should fail on iOS placeholder check ❌

### 2. Fix iOS Firebase Configuration

**Go to**: https://console.firebase.google.com/project/plateful-83021

**Do this**:
1. Add iOS app (or download config if exists)
2. Bundle ID: `com.plateful.app`
3. Download `GoogleService-Info.plist`
4. Replace the file:
   ```bash
   mv ~/Downloads/GoogleService-Info.plist apps/mobile/ios/Plateful/
   ```

### 3. Verify Again
```bash
npm run verify:firebase
```

**Expected result**: ✅ All checks passed!

### 4. Test Both Platforms
```bash
# Terminal 1
npm run android

# Terminal 2  
npm run ios
```

---

## 📖 Need More Details?

- **Complete guide**: `docs/FIREBASE_SETUP_CRITICAL.md`
- **iOS step-by-step**: `docs/FIREBASE_IOS_FIX_INSTRUCTIONS.md`
- **Full explanation**: `FIREBASE_SETUP_SUMMARY.md`

---

## 🎯 What Changed?

### ✅ FIXED (Already Done)
- Moved `google-services.json` to correct location
- Android Firebase is now properly configured
- Added verification script
- Package names are consistent everywhere

### ⏳ TODO (You Need To Do)
- Download real iOS Firebase config file
- Replace placeholder `GoogleService-Info.plist`

---

## 🔍 Quick Commands

```bash
# Verify Firebase configuration
npm run verify:firebase

# Run iOS
npm run ios

# Run Android
npm run android

# Clean rebuild (if issues)
npm run prebuild:clean
```

---

## 🆘 Having Issues?

### Error: iOS still has PLACEHOLDER
👉 You need to download the real file from Firebase Console  
👉 See: `docs/FIREBASE_IOS_FIX_INSTRUCTIONS.md`

### Error: google-services.json not found
👉 Already fixed! Run `npm run verify:firebase` to confirm

### Error: Build fails
👉 Try: `npm run prebuild:clean` then rebuild

### Error: Firebase not connecting
👉 Check environment variables in `.env` file

---

**Your Package Name**: `com.plateful.app` (used everywhere ✅)  
**Firebase Project**: `plateful-83021`  
**Status**: Android ✅ | iOS ⏳


