# Plateful App - Setup Complete! 🎉

## ✅ Setup Status

### Dependencies
- ✅ All npm packages installed (1137 packages)
- ✅ TypeScript type-checking passing
- ✅ React 19 compatibility fixed in UI package
- ✅ Monorepo workspace configured

### Environment Configuration
- ✅ Firebase config set up in `apps/mobile/.env`
- ✅ Azure Cosmos DB & Anthropic API configured in `apps/api/.env`

### System Requirements
- ✅ Node.js v20.17.0 (meets minimum v18.0.0+)
- ✅ npm v10.8.2 (meets minimum v9.0.0+)

⚠️ **Note**: You have Node v20.17.0, but React Native 0.81.4 prefers v20.19.4+. This is fine for development - the app will run, but you may want to upgrade Node.js later for optimal performance.

---

## 🚀 Quick Start Guide

### Option 1: Run Everything (Recommended for Development)
```bash
# From project root - starts both mobile and API
npm run dev
```
This will:
- Start the mobile app Metro bundler on port 8081
- Start the API dev server on port 3000

### Option 2: Run Mobile App Only
```bash
# Method 1: Using shell script (from project root)
./start-mobile.sh

# Method 2: Direct command (from project root)
cd apps/mobile && npm run dev

# Method 3: From apps/mobile directory
cd apps/mobile
npm run dev
```

### Option 3: Run API Only
```bash
# Method 1: Using shell script (from project root)
./start-api.sh

# Method 2: Direct command (from project root)
cd apps/api && npm run dev

# Method 3: From apps/api directory
cd apps/api
npm run dev
```

---

## 📱 Running on Devices

### Web Browser (Easiest - No Device Needed)
```bash
cd apps/mobile
npm run web
```
Then open http://localhost:8081 in your browser.

### iOS Simulator (macOS only)
```bash
cd apps/mobile
npm run ios
```
**Requirements**: Xcode installed, iOS Simulator available

### Android Emulator
```bash
cd apps/mobile
npm run android
```
**Requirements**: Android Studio installed, emulator running or device connected

### Physical Device (Development Build - Required for Firebase Auth)
⚠️ **Important**: Firebase Auth doesn't work in Expo Go. You need a development build.

```bash
cd apps/mobile

# For Android
npx expo run:android

# For iOS (macOS only)
npx expo run:ios
```
This will:
1. Build the app (~5-10 minutes first time)
2. Install on your connected device/emulator
3. Start Metro bundler
4. Connect automatically

---

## 🔍 Verify Everything Works

### 1. Check TypeScript
```bash
npm run type-check
```
Expected: ✅ No errors (already passing!)

### 2. Test API Endpoint
```bash
# Start API
npm run api

# In another terminal, test health endpoint
curl http://localhost:3000/api/health
```
Expected: `{"status":"ok",...}`

### 3. Test Mobile App
```bash
npm run mobile
```
Expected: Metro bundler starts, QR code displays

---

## 📂 Project Structure

```
plateful-app/
├── apps/
│   ├── mobile/          # Expo React Native app
│   │   ├── .env         # ✅ Firebase config (EXPO_PUBLIC_*)
│   │   └── app/         # Screens: auth, tabs (home, groceries, settings)
│   └── api/             # Vercel serverless API
│       ├── .env         # ✅ Cosmos DB + Anthropic config
│       └── api/         # Endpoints: health, chat, recipes
├── packages/
│   ├── shared/          # Shared types & utilities
│   └── ui/              # ✅ Fixed React 19 compatibility
└── README.md            # Full documentation
```

---

## 🔥 Firebase Setup (If Not Done Yet)

Your Firebase config is set up, but you may need to:

### 1. Enable Authentication Methods
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project `plateful-83021`
3. Authentication → Sign-in method
4. Enable:
   - ✅ Email/Password
   - ✅ Google (if using Google Sign-In)

### 2. Deploy Security Rules (Important!)
```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login
firebase login

# Deploy rules (protects your data!)
firebase deploy --only firestore:rules,storage:rules
```

**Security Rules Location**:
- `firestore.rules` - Database security
- `storage.rules` - File upload security

### 3. Initialize Firestore & Storage
1. Firestore: Console → Firestore Database → Create Database
2. Storage: Console → Storage → Get Started
3. Choose region: `us-central1` (recommended)

---

## 🛠️ Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run all apps (mobile + API) |
| `./start-mobile.sh` | Run mobile app only (from root) |
| `./start-api.sh` | Run API only (from root) |
| `cd apps/mobile && npm run dev` | Run mobile app (alternative) |
| `cd apps/api && npm run dev` | Run API (alternative) |
| `npm run type-check` | Check TypeScript types |
| `npm run build` | Build all apps |
| `npm run clean` | Clean build artifacts |
| `npm run format` | Format code with Prettier |

---

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors
```bash
# Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### Issue: Metro bundler won't start
```bash
cd apps/mobile
npm run start -- --clear
```

### Issue: Firebase Auth errors
- ✅ Make sure you're using a **development build** (not Expo Go)
- Check Firebase Console: Authentication is enabled
- Verify `.env` file has all `EXPO_PUBLIC_*` variables

### Issue: Firestore permission denied
```bash
# Deploy security rules
firebase deploy --only firestore:rules
```

### Issue: Node version warnings
You can safely ignore the warnings about Node 20.19.4. Your Node v20.17.0 works fine for development. To eliminate warnings:
```bash
# Using nvm (recommended)
nvm install 20.19.4
nvm use 20.19.4

# Or download from nodejs.org
```

---

## 📚 Additional Documentation

- **[README.md](./README.md)** - Complete project documentation
- **[docs/BACKEND_SETUP.md](./docs/BACKEND_SETUP.md)** - Backend architecture
- **[docs/CHAT_QUICKSTART.md](./docs/CHAT_QUICKSTART.md)** - Chat system guide
- **[AUTH_SCREENS_GUIDE.md](./AUTH_SCREENS_GUIDE.md)** - Authentication flow
- **[FIREBASE_VERIFICATION.md](./FIREBASE_VERIFICATION.md)** - Firebase testing

---

## 🎯 Next Steps

1. **Start the app**:
   ```bash
   # Option A: Start everything (mobile + API)
   npm run dev
   
   # Option B: Start mobile app only
   ./start-mobile.sh
   # OR
   cd apps/mobile && npm run dev
   ```

2. **Test on device**: Build and install development build
   ```bash
   cd apps/mobile
   npx expo run:android  # or npx expo run:ios
   ```

3. **Deploy Firebase rules** (if not done):
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

4. **Test authentication**: Open app → Register/Sign in

5. **Test features**:
   - Create grocery list
   - Add items
   - Test chat functionality
   - Upload images

---

## 🆘 Need Help?

- Check documentation in `docs/` folder
- Review logs in Metro bundler
- Check Firebase Console for auth/database issues
- Review this file for common solutions

**All dependencies are installed and configured!** 🎉

You're ready to start developing! 🚀

