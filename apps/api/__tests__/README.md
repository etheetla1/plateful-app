# API Tests

## Running Tests

### Unit Tests (Mocked)
```bash
cd apps/api
npm test
```

### Integration Tests (Real Firebase Auth)

The auth tests use **real Firebase Auth** with test credentials:
- Email: `test@jesttest.com`
- Password: `JestTestPassword`

#### Setup Options:

**Option 1: Use Real Firebase (Default)**
1. Ensure Firebase config is available (from `apps/mobile/.env` or set in `apps/api/.env`):
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

2. Ensure the test user exists in your Firebase project:
   - Email: `test@jesttest.com`
   - Password: `JestTestPassword`
   - Or the test will create it automatically on first run

3. Run tests:
   ```bash
   cd apps/api
   npm test
   ```

**Option 2: Use Firebase Auth Emulator**
1. Install Firebase Tools (if not already):
   ```bash
   npm install -g firebase-tools
   ```

2. Start the emulator:
   ```bash
   firebase emulators:start --only auth
   ```

3. Set environment variable:
   ```bash
   export USE_FIREBASE_EMULATOR=true
   # Or on Windows:
   set USE_FIREBASE_EMULATOR=true
   ```

4. Run tests:
   ```bash
   cd apps/api
   npm test
   ```

## Test Files

- `auth.test.ts` - Real Firebase Auth sign-in tests
- `chat-meal-ideas.test.ts` - Chat API endpoint tests (mocked)
- `recipe-generation.test.ts` - Recipe generation tests (mocked)
- `recipe-save.test.ts` - Recipe save/update tests (mocked)
- `grocery-list.test.ts` - Grocery list generation tests (mocked)

## Notes

- Auth tests use **real Firebase Auth** - ensure test user exists or tests will create it
- Other tests use **mocked Cosmos DB** - no database setup needed
- Test timeouts are set to 30 seconds for real Firebase calls

