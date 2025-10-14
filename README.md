# Plateful

A modern grocery management app built with Expo React Native and Firebase, deployed on Vercel.

## Architecture

**Monorepo Structure:**
```
plateful/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── api/             # Vercel serverless functions
├── packages/
│   ├── shared/          # Shared types and utilities
│   └── ui/              # Shared UI components
```

**Stack:**
- **Mobile**: Expo React Native with TypeScript, Expo Router
- **Backend**: Firebase (Auth, Firestore, Storage)
- **API**: Vercel serverless functions with Hono
- **Tooling**: pnpm workspaces + Turbo

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Expo CLI
- Firebase project
- Vercel account (for API deployment)

## Initial Setup

### 1. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies
pnpm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "Plateful"
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google Sign-in
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database (start in test mode)
5. Enable Firebase Storage:
   - Go to Storage
   - Get started
6. Get Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps"
   - Add a Web app
   - Copy the config values

### 3. Configure Environment Variables

**Mobile App (`apps/mobile/.env`):**

```bash
# Copy the example file
cp apps/mobile/.env.example apps/mobile/.env

# Edit apps/mobile/.env with your Firebase config
```

Add your Firebase configuration:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# For Google Sign-in, get these from Firebase Console > Authentication > Sign-in method > Google
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
```

**API (`apps/api/.env.local` for local development):**

```bash
# Copy the example file
cp apps/api/.env.example apps/api/.env.local

# Edit with your Firebase Admin SDK credentials
```

For production, set these in Vercel project settings.

### 4. Deploy Firebase Security Rules

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init

# Select:
# - Firestore
# - Storage
# - Use existing project (select your Plateful project)
# - Use the existing firestore.rules and storage.rules files

# Deploy the rules
firebase deploy --only firestore:rules,storage:rules
```

## Development

### Run Everything

```bash
# Run all apps in development mode
pnpm dev
```

### Run Mobile App Only

```bash
# Start Expo development server
pnpm mobile

# Or directly in the mobile directory
cd apps/mobile
pnpm dev

# For specific platforms:
pnpm ios      # iOS simulator
pnpm android  # Android emulator
pnpm web      # Web browser
```

### Run API Only

```bash
# Start Vercel development server
pnpm api

# Or directly in the api directory
cd apps/api
pnpm dev
```

The API will be available at `http://localhost:3000/api/health`

## Building

### Build Mobile App

```bash
# Build for all platforms
pnpm build

# Or build mobile app specifically
cd apps/mobile
pnpm build
```

### Type Checking

```bash
# Check types across all packages
pnpm type-check
```

## Deployment

### Deploy API to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd apps/api
vercel

# For production:
vercel --prod
```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add the environment variables from `.env.example`

### Mobile App Deployment

**iOS (TestFlight/App Store):**
```bash
cd apps/mobile
eas build --platform ios
```

**Android (Play Store):**
```bash
cd apps/mobile
eas build --platform android
```

Note: Requires [EAS account and setup](https://docs.expo.dev/build/setup/)

## Project Structure

```
plateful/
├── apps/
│   ├── mobile/
│   │   ├── app/                    # Expo Router pages
│   │   │   ├── (tabs)/            # Tab navigation screens
│   │   │   │   ├── index.tsx      # Home screen
│   │   │   │   ├── groceries.tsx  # Groceries screen
│   │   │   │   └── settings.tsx   # Settings screen
│   │   │   ├── sign-in.tsx        # Sign-in screen
│   │   │   └── _layout.tsx        # Root layout
│   │   ├── src/
│   │   │   ├── config/            # Firebase config
│   │   │   └── services/          # Auth, Firestore, Storage services
│   │   ├── app.json               # Expo configuration
│   │   └── package.json
│   └── api/
│       ├── api/
│       │   └── health.ts          # Health check endpoint
│       ├── vercel.json            # Vercel configuration
│       └── package.json
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── types/             # Shared TypeScript types
│   │       └── utils/             # Shared utilities
│   └── ui/
│       └── src/
│           └── components/        # Shared UI components
├── firestore.rules                # Firestore security rules
├── storage.rules                  # Storage security rules
├── turbo.json                     # Turbo configuration
├── pnpm-workspace.yaml            # pnpm workspace configuration
└── package.json                   # Root package.json
```

## Key Features

### Authentication
- ✅ Email/Password sign-in
- ✅ Google Sign-in
- ✅ Secure Firebase authentication

### Data Management
- ✅ Firestore for grocery lists and items
- ✅ Firebase Storage for images
- ✅ Security rules protecting user data

### Mobile App
- ✅ Expo Router for navigation
- ✅ Tab-based navigation (Home, Groceries, Settings)
- ✅ Type-safe with TypeScript
- ✅ Shared UI components

### API
- ✅ Serverless functions on Vercel
- ✅ Hono framework for routing
- ✅ Health check endpoint

## Security

- All Firestore data is protected by security rules requiring authentication
- Only document owners can read/write their own data
- Storage rules prevent unauthorized access
- Client secrets use `EXPO_PUBLIC_*` prefix for Expo
- Server secrets are kept in Vercel environment variables

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run all apps in development |
| `pnpm mobile` | Run mobile app only |
| `pnpm api` | Run API only |
| `pnpm build` | Build all apps |
| `pnpm type-check` | Type check all packages |
| `pnpm clean` | Clean build artifacts |
| `pnpm format` | Format code with Prettier |

## Troubleshooting

### Module not found errors
```bash
# Clear all node_modules and reinstall
pnpm clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Expo app won't start
```bash
cd apps/mobile
rm -rf .expo node_modules
pnpm install
pnpm start --clear
```

### TypeScript errors
```bash
# Rebuild TypeScript projects
pnpm build
pnpm type-check
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm type-check` to ensure no TypeScript errors
4. Run `pnpm format` to format code
5. Submit a pull request

## License

MIT
