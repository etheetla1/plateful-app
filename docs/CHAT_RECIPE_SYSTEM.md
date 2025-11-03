# Chat-Driven Recipe Discovery System

## Overview

The Plateful app now includes an AI-powered chat interface for discovering recipes through natural conversation. This system implements the full flow described in `chat-plan.md`.

## Architecture

### Data Flow

```
Chat Interface (Mobile)
    ↓
Chat API (Store messages in Cosmos DB)
    ↓
Recipe Generation Endpoint
    ↓
Intent Extraction (AI analyzes conversation)
    ↓
Recipe Search (Anthropic Search API)
    ↓
Web Scraping (Extract recipe content)
    ↓
Recipe Formatting (AI structures the data)
    ↓
Cosmos DB Storage (Save recipe linked to conversation)
    ↓
Recipe Display (Mobile app shows structured recipe)
```

## Cosmos DB Schema

### Database: `plateful-core`

#### Container: `chat-conversations`
- **Partition Key**: `/conversationID`
- **Purpose**: Store conversation metadata

```json
{
  "id": "conv-...",
  "conversationID": "conv-...",
  "userID": "user-...",
  "status": "exploring|decided|recipe_found",
  "decidedDish": "Chicken Tikka Masala",
  "searchQuery": "authentic spicy chicken tikka masala recipe",
  "recipeID": "recipe-...",
  "createdAt": "2025-10-17T...",
  "updatedAt": "2025-10-17T..."
}
```

#### Container: `chat-messages`
- **Partition Key**: `/conversationID`
- **Unique Keys**: `/messageIndex`
- **Purpose**: Store individual chat messages

```json
{
  "id": "msg-...",
  "conversationID": "conv-...",
  "messageIndex": 0,
  "role": "user|assistant",
  "content": "Message text",
  "timestamp": "2025-10-17T..."
}
```

#### Container: `recipes`
- **Partition Key**: `/userID`
- **Unique Keys**: `/recipeNameLower`, `/sourceUrlLower`
- **Purpose**: Store structured recipe data

#### Container: `pantries`
- **Partition Key**: `/userID`
- **Purpose**: Store user pantry items

#### Container: `grocery-lists`
- **Partition Key**: `/userID`
- **Purpose**: Store user grocery lists

#### Container: `grocery-items`
- **Partition Key**: `/listID`
- **Purpose**: Store items within grocery lists

#### Container: `tutorials`
- **Partition Key**: `/userID`
- **Purpose**: Store saved tutorials and learning content

#### Container: `meal-tracking`
- **Partition Key**: `/userID`
- **Purpose**: Store tracked meals and daily nutrition data

```json
{
  "id": "recipe-...",
  "userID": "user-...",
  "recipeID": "recipe-...",
  "recipeNameLower": "chicken tikka masala",
  "sourceUrlLower": "https://...",
  "conversationID": "conv-...",
  "recipeData": {
    "title": "Chicken Tikka Masala",
    "description": "A rich and spicy Indian curry...",
    "portions": "4 servings",
    "ingredients": ["500g chicken breast", "..."],
    "instructions": ["Marinate chicken...", "..."],
    "nutrition": {
      "calories_per_portion": "520 kcal",
      "protein": "38g",
      "carbs": "16g",
      "fat": "31g"
    },
    "sourceUrl": "https://..."
  },
  "isSaved": false,
  "createdAt": "2025-10-17T...",
  "updatedAt": "2025-10-17T..."
}
```

## API Endpoints

### Chat Management

#### POST `/api/chat/conversation`
Create a new conversation.

**Request:**
```json
{
  "userID": "user-123"
}
```

**Response:**
```json
{
  "conversation": { /* ChatConversation */ }
}
```

#### GET `/api/chat/conversation/:id`
Get conversation by ID.

#### PATCH `/api/chat/conversation/:id`
Update conversation status.

#### POST `/api/chat/message`
Send a chat message.

**Request:**
```json
{
  "conversationID": "conv-123",
  "role": "user",
  "content": "I want something spicy"
}
```

#### GET `/api/chat/messages/:conversationID`
Get all messages for a conversation.

#### GET `/api/chat/conversations/user/:userID`
Get all conversations for a user.

### Recipe Generation

#### POST `/api/generate-recipe`
Generate a recipe from a conversation (runs full flow).

**Request:**
```json
{
  "conversationID": "conv-123",
  "userID": "user-123"
}
```

**Response:**
```json
{
  "recipe": { /* Recipe */ },
  "intent": {
    "dish": "Chicken Tikka Masala",
    "searchQuery": "authentic spicy chicken tikka masala recipe"
  },
  "searchResult": {
    "title": "Authentic Chicken Tikka Masala",
    "url": "https://..."
  }
}
```

#### GET `/api/generate-recipe/user/:userID`
Get all recipes for a user.

#### GET `/api/generate-recipe/:recipeID?userID=...`
Get a specific recipe.

#### PATCH `/api/generate-recipe/:recipeID`
Update recipe (e.g., save/unsave).

**Request:**
```json
{
  "userID": "user-123",
  "isSaved": true
}
```

## Environment Variables

### Required for Chat & Recipe System

Add these to your `.env` file:

```bash
# Azure Cosmos DB (required for chat/recipe storage)
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-db-primary-key

# Anthropic API (already configured for recipe search)
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Optional Cosmos DB Setup

If Cosmos DB is not configured, the chat features will be disabled but the basic recipe search (original functionality) will still work.

## Setup Instructions

### 1. Install Dependencies

```bash
# From project root
npm install
```

### 2. Set Up Cosmos DB (Azure)

1. Create an Azure Cosmos DB account (NoSQL API)
2. Create a database named `plateful-core`
3. Create the following containers:

**Container: chat-conversations**
- Container ID: `chat-conversations`
- Partition key: `/conversationID`

**Container: chat-messages**
- Container ID: `chat-messages`
- Partition key: `/conversationID`
- Unique keys: `/messageIndex`

**Container: user-profiles**
- Container ID: `user-profiles`
- Partition key: `/userID`
- Unique keys: `/email`, `/phoneNumber`, `/username`

**Container: recipes**
- Container ID: `recipes`
- Partition key: `/userID`
- Unique keys: `/recipeNameLower`, `/sourceUrlLower`

**Container: pantries**
- Container ID: `pantries`
- Partition key: `/userID`

**Container: grocery-lists**
- Container ID: `grocery-lists`
- Partition key: `/userID`

**Container: grocery-items**
- Container ID: `grocery-items`
- Partition key: `/listID`

**Container: tutorials**
- Container ID: `tutorials`
- Partition key: `/userID`

**Container: meal-tracking**
- Container ID: `meal-tracking`
- Partition key: `/userID`

4. Copy the endpoint and primary key to your `.env` file

### 3. Run the API Server

```bash
cd apps/api
npm run dev
```

Server runs on `http://localhost:3000`

### 4. Run the Mobile App

```bash
cd apps/mobile
npm run start
```

## Usage Flow

### User Journey

1. **Open Chat Tab**: User opens the chat interface
2. **Conversation**: User describes what they want to eat
   - "I want something spicy for dinner"
   - AI suggests options
   - User decides on a dish
3. **Find Recipe**: User clicks "Find Recipe" button
4. **Processing**:
   - Intent extraction analyzes conversation
   - Recipe search finds best URL
   - Web scraping extracts content
   - AI formats into structured JSON
   - Recipe saved to Cosmos DB
5. **View Recipe**: Recipe appears in Recipes tab with:
   - Ingredients list
   - Step-by-step instructions
   - Nutrition information
   - Link to original source

## Key Features

### ✅ Implemented

- [x] Multi-turn chat conversation
- [x] Message persistence in Cosmos DB
- [x] Intent extraction from conversation
- [x] Anthropic web search integration
- [x] Recipe page scraping
- [x] AI-powered recipe formatting
- [x] Structured recipe storage
- [x] Recipe display with nutrition info
- [x] Save/bookmark recipes
- [x] Link recipes to conversations
- [x] Duplicate detection

### 🔄 Pending Enhancements

- [ ] Real-time AI chat (currently uses mock responses)
- [ ] Image support for recipes
- [ ] Grocery list integration
- [ ] Recipe ratings and reviews
- [ ] Meal planning features
- [ ] Share recipes with other users

## AI Prompts

### Intent Extraction

Analyzes conversation history to extract:
- Decided dish name
- Optimized search query

### Recipe Formatter

Structures scraped content into JSON with:
- Title, description, portions
- Ingredients and instructions
- Nutrition data (with AI estimates if missing)
- Always per-portion calories

## Error Handling

- **Search fails**: Retries with simplified query
- **Scrape fails**: Returns error to chat
- **Missing nutrition**: AI estimates and marks as "(estimated by AI)"
- **Duplicate recipe**: Links existing recipe instead of creating new

## Testing

### Manual Testing Checklist

1. Start a new conversation ✓
2. Exchange multiple messages ✓
3. Click "Find Recipe" ✓
4. Verify recipe appears in Recipes tab ✓
5. Test save/unsave functionality ✓
6. Start another conversation ✓
7. Generate another recipe ✓
8. Check for duplicates ✓

## Troubleshooting

### Chat features not working
- Check Cosmos DB credentials in `.env`
- Verify containers are created
- Check API server logs

### Recipe generation fails
- Verify ANTHROPIC_API_KEY is set
- Check conversation has enough messages
- Look for error details in API logs

### Recipes not displaying
- Check Recipes tab is using new component
- Verify recipe data structure in Cosmos DB
- Check API endpoint connectivity

## Development Notes

- Mock user ID used: `user-dev-001`
- API runs on port 3000
- Mobile app uses `http://localhost:3000`
- Chat uses simple keyword-based responses (will be replaced with real AI)

## Next Steps

1. Integrate real-time Claude API for chat responses
2. Add user authentication (link to Firebase)
3. Deploy API to Vercel
4. Set up production Cosmos DB
5. Add recipe images and media
6. Implement meal planning features

