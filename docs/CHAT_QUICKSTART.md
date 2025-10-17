# Quick Start: Chat Recipe System

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+
- pnpm installed
- Anthropic API key
- Azure Cosmos DB account (optional for testing)

### Step 1: Install Dependencies

```bash
# From project root
pnpm install
```

### Step 2: Set Up Environment Variables

Create `apps/api/.env`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (chat features will be disabled without these)
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-primary-key
```

### Step 3: Start the API Server

```bash
cd apps/api
pnpm dev
```

Server runs on `http://localhost:3000`

### Step 4: Start the Mobile App

```bash
cd apps/mobile
pnpm start
```

### Step 5: Test the Flow

1. Open app in simulator/emulator
2. Navigate to **Chat** tab
3. Type: "I want something spicy"
4. Continue conversation
5. Click **Find Recipe** button
6. Check **Recipes** tab for the generated recipe

## 🧪 Testing Without Cosmos DB

If you don't have Cosmos DB set up yet:

1. The API will start without chat features
2. The original recipe search (`/api/recipe`) will still work
3. Chat tab will show errors when trying to create conversations

## ✅ What You Get

- **Chat Interface**: Natural conversation about food
- **AI-Powered Search**: Finds real recipes from the web
- **Smart Extraction**: Structures recipes into usable format
- **Automatic Storage**: Saves recipes with conversation link
- **Rich Display**: Beautiful recipe cards with ingredients & instructions

## 📖 Full Documentation

See [CHAT_RECIPE_SYSTEM.md](./CHAT_RECIPE_SYSTEM.md) for complete details.

## 🐛 Troubleshooting

### API won't start
- Check you have `pnpm` installed
- Run `pnpm install` again
- Verify `.env` file exists

### Chat features disabled
- You need Cosmos DB credentials
- See setup guide in CHAT_RECIPE_SYSTEM.md

### Recipe generation fails
- Check ANTHROPIC_API_KEY is valid
- Ensure you discussed a specific dish
- Look at API logs for details

## 🔗 API Endpoints

Test them with curl:

```bash
# Health check
curl http://localhost:3000/health

# Original recipe search (works without Cosmos)
curl -X POST http://localhost:3000/api/recipe \
  -H "Content-Type: application/json" \
  -d '{"dish":"lasagna"}'

# Create conversation (requires Cosmos)
curl -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"userID":"test-user"}'
```

## 🎯 Next Steps

1. Set up Cosmos DB for full functionality
2. Customize AI prompts in `apps/api/services/`
3. Add real-time AI chat responses
4. Integrate with Firebase authentication
5. Deploy to production

