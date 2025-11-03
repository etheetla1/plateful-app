# 🧩 Project Guide: Collaborative Recipe Discovery Flow (Plateful)

This guide describes the full workflow and technical plan for implementing the **chat-driven recipe discovery feature** in the Plateful app.

---

## 🧠 Purpose

Enable users to **collaboratively explore meal ideas with an AI**, decide on a dish together, and automatically fetch a **real, structured recipe** from the web — not generate one.

The flow includes:
1. Multi-turn conversation storage in Cosmos DB.
2. Intent extraction from conversation.
3. Recipe search using Anthropic Search.
4. Page scraping and recipe structuring.
5. Display and persistence in the app.

---

## 🗄️ Cosmos DB Design

**Database:** `plateful-core`

| Container | Partition Key | Unique Keys | Purpose |
|------------|----------------|--------------|----------|
| `chat-conversations` | `/conversationID` | — | Conversation metadata and linkage. |
| `chat-messages` | `/conversationID` | `/messageIndex` | Ordered chat history per conversation. |
| `user-profiles` | `/userID` | `/email`, `/phoneNumber`, `/username` | User identity and preferences. |
| `recipes` | `/userID` | `/recipeNameLower`, `/sourceUrlLower` | Structured recipe data tied to user. |
| `pantries` | `/userID` | — | User pantry items. |
| `grocery-lists` | `/userID` | — | User grocery lists. |
| `grocery-items` | `/listID` | — | Items within grocery lists. |
| `tutorials` | `/userID` | — | Saved tutorials and learning content. |
| `meal-tracking` | `/userID` | — | Tracked meals and nutrition data. |

Each recipe optionally links back to its originating conversation through `conversationID`.

---

## 🧭 End-to-End Flow

### Step 1: Chat Phase (Exploration)
- The user chats with an AI model to describe or explore meal ideas.
- Messages are stored in:
  - `chat-messages` (individual messages)
  - `chat-conversations` (metadata, timestamps)
- Example flow:
  ```
  User: I want something spicy for dinner.
  AI: Maybe pad thai, chicken tikka masala, or drunken noodles?
  User: What’s chicken tikka masala?
  AI: It’s an Indian dish with a rich tomato-based sauce.
  User: That sounds great — let’s do that.
  ```

When the user confirms a choice, the conversation state changes to:
```json
{
  "status": "decided",
  "decidedDish": "chicken tikka masala"
}
```

---

### Step 2: Intent Extraction

**Trigger:** User confirms decision or clicks “Find Recipe”.

**Process:**
1. Fetch all chat messages for `conversationID`.
2. Run the **Intent Extraction Prompt** (AI model).
3. Output should include:
   ```json
   {
     "dish": "Chicken Tikka Masala",
     "searchQuery": "authentic spicy chicken tikka masala recipe"
   }
   ```
4. Store these values in the `chat-conversations` document.

---

### Step 3: Recipe Search (Anthropic Search)

**Input:** `searchQuery` from previous step  
**Process:**
1. Call Anthropic Search API with the given query.
2. Retrieve the most relevant recipe page URL.
3. Return top hit (with title, snippet, and URL).

**Output Example:**
```json
{
  "title": "Authentic Chicken Tikka Masala Recipe",
  "url": "https://example.com/chicken-tikka-masala"
}
```

---

### Step 4: Scraping Service

**Purpose:** Extract readable text from the selected recipe webpage.

**Steps:**
1. Send the chosen URL to a dedicated scraping utility.
2. Receive back the raw plain text of the page.
3. Remove HTML, images, and comments.

**Output Example:**
```
Chicken Tikka Masala Recipe
Serves 4
Ingredients:
- 500g chicken breast
- 1 cup yogurt
- 2 tbsp garam masala
...
Instructions:
1. Marinate chicken...
2. Grill until browned...
3. Add to sauce and simmer...
Calories: 520 kcal per serving
```

---

### Step 5: Recipe Structuring (AI Formatting)

Use a second AI prompt to **clean and standardize** the scraped text.

**Input:** raw scraped text

**Output JSON Schema:**
```json
{
  "title": "",
  "description": "",
  "portions": "",                // e.g. "4 servings" or "4 (estimated by AI)"
  "ingredients": [""],
  "instructions": [""],
  "nutrition": {
    "calories_per_portion": "",  // Always per portion, not total
    "protein": "",
    "carbs": "",
    "fat": ""
  },
  "sourceUrl": ""
}
```

**Rules:**
- Do **not** generate or invent recipes.
- Remove irrelevant text (ads, personal stories, commentary).
- If serving count or nutrition data are missing:
  - Estimate them and mark with “(estimated by AI)”.
- Calories must always refer to **per portion**.
- Keep ingredient and instruction lists concise and consistent.

---

### Step 6: Cosmos Recipe Insertion

Store the cleaned recipe JSON into the `recipes` container:

```json
{
  "userID": "user-123",
  "recipeID": "recipe-001",
  "recipeNameLower": "chicken tikka masala",
  "sourceUrlLower": "https://example.com/chicken-tikka-masala",
  "conversationID": "conv-456",
  "recipeData": {
    "title": "Chicken Tikka Masala",
    "description": "A rich and spicy Indian curry with marinated chicken in tomato cream sauce.",
    "portions": "4 servings",
    "ingredients": [
      "500g chicken breast",
      "200ml tomato puree",
      "2 tbsp garam masala",
      "150ml cream",
      "1 onion, finely chopped"
    ],
    "instructions": [
      "Marinate chicken in yogurt and spices for at least 2 hours.",
      "Sauté onions and garlic in butter until golden.",
      "Add tomato puree and simmer for 10 minutes.",
      "Add chicken and cream, cook until thickened.",
      "Serve with basmati rice."
    ],
    "nutrition": {
      "calories_per_portion": "520 kcal",
      "protein": "38g",
      "carbs": "16g",
      "fat": "31g"
    },
    "sourceUrl": "https://example.com/chicken-tikka-masala"
  },
  "createdAt": "2025-10-16T18:30:00Z"
}
```

---

### Step 7: Frontend Integration

- **Chat Screen**
  - Displays chat history.
  - User can press **“Find Recipe”** once the dish is decided.
- **Recipe View Screen**
  - Displays formatted recipe JSON.
  - Allows “Save to My Recipes” (sets `isSaved: true` in Cosmos).
- **Linking**
  - Each recipe card includes a “View Conversation” link back to `conversationID`.

---

## 🧩 Key AI Prompts

### A. Intent Extraction Prompt
Extracts final dish and search query.
```json
{
  "dish": "Chicken Tikka Masala",
  "searchQuery": "authentic spicy chicken tikka masala recipe"
}
```

### B. Recipe Formatter Prompt
Cleans scraped recipe and enforces per-portion and portion count logic.
If missing, append `(estimated by AI)`.

---

## ⚙️ API Endpoints

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/chat-message` | POST | Store chat messages. |
| `/api/generate-recipe` | POST | Run full flow: intent → search → scrape → format → store. |
| `/api/recipes/:userID` | GET | Retrieve user’s saved recipes. |
| `/api/recipe/:id` | GET | Fetch one recipe by ID. |

---

## 🧠 Error Handling & Fallbacks

- **Search fails:** Retry with simplified query.
- **Scrape fails:** Return message to chat suggesting alternate recipe sources.
- **Nutrition missing:** Mark with `(estimated by AI)`.
- **Duplicate recipe:** Skip insertion; link existing recipeID instead.

---

## ✅ Summary Checklist

- [x] Chat stored in `chat-messages` + `chat-conversations`
- [x] Decision triggers intent extraction
- [x] Query sent to Anthropic Search
- [x] Scraper retrieves text
- [x] Formatter standardizes into JSON
- [x] Recipe stored and linked to conversation
- [x] Calories per portion
- [x] Portions always included or estimated
- [x] Nothing generated — all sourced from real pages

---
