# Migration Guide: Old Recipe Search → Chat Recipe System

## Overview

This guide helps you understand the differences between the old and new recipe systems and how to choose between them.

## Side-by-Side Comparison

### Old System (Simple Search)

**File**: `apps/mobile/app/(tabs)/recipes.tsx`

**Flow**:
1. User enters dish name
2. Direct Anthropic search
3. Returns markdown recipe
4. Display as formatted text

**Pros**:
- Simple and fast
- No database required
- Works immediately with just ANTHROPIC_API_KEY

**Cons**:
- No conversation history
- No structured data
- Can't save recipes
- No user-specific storage

### New System (Chat-Driven)

**Files**:
- `apps/mobile/app/(tabs)/chat.tsx` - Chat interface
- `apps/mobile/app/(tabs)/recipes-new.tsx` - Recipe display

**Flow**:
1. User chats about preferences
2. AI suggests options
3. User decides on dish
4. Intent extraction → Search → Scrape → Format
5. Structured recipe stored in database
6. Beautiful display with save functionality

**Pros**:
- Natural conversation
- Structured recipe data
- Save/bookmark recipes
- Nutrition information
- User-specific collections
- Recipe-conversation linking

**Cons**:
- Requires Cosmos DB setup
- More complex architecture
- Additional API costs

## Migration Paths

### Path 1: Keep Both (Recommended)

Keep the old simple search as a fallback and add the new chat system.

**Steps**:
1. Rename old file: `recipes.tsx` → `recipes-simple.tsx`
2. Update tab layout to show both:

```typescript
// apps/mobile/app/(tabs)/_layout.tsx
<Tabs.Screen
  name="recipes-simple"
  options={{
    title: 'Quick Search',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="search" size={size} color={color} />
    ),
  }}
/>
<Tabs.Screen
  name="chat"
  options={{
    title: 'Chat',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="chatbubbles" size={size} color={color} />
    ),
  }}
/>
<Tabs.Screen
  name="recipes-new"
  options={{
    title: 'My Recipes',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="bookmark" size={size} color={color} />
    ),
  }}
/>
```

**Result**: Three tabs - Quick Search, Chat, My Recipes

### Path 2: Replace Old with New

Completely replace the old system with the new chat-driven approach.

**Steps**:
1. Delete or backup: `apps/mobile/app/(tabs)/recipes.tsx`
2. Rename: `recipes-new.tsx` → `recipes.tsx`
3. Update tab layout (already done)

**Result**: Chat and Recipes tabs only

### Path 3: Gradual Migration

Start with old system, add chat, migrate users gradually.

**Steps**:
1. Keep old `recipes.tsx` as default
2. Add chat as experimental feature
3. Show migration prompt to users
4. Track usage analytics
5. Eventually deprecate old system

## Feature Parity Checklist

If replacing the old system, ensure the new one covers all use cases:

- [x] Recipe search
- [x] Recipe display
- [x] Ingredient lists
- [x] Instructions
- [ ] Quick dish name search (need to add)
- [x] Save recipes
- [x] Nutrition info
- [x] Source URL links

## API Endpoint Mapping

### Old Endpoint
```typescript
POST /api/recipe
Body: { dish: "lasagna" }
Response: { recipe: "markdown text", dish: "lasagna" }
```

### New Endpoints
```typescript
// Create conversation
POST /api/chat/conversation
Body: { userID: "user-123" }

// Send message
POST /api/chat/message
Body: { conversationID: "conv-123", role: "user", content: "I want pasta" }

// Generate recipe
POST /api/generate-recipe
Body: { conversationID: "conv-123", userID: "user-123" }

// Get recipes
GET /api/generate-recipe/user/:userID
```

## Data Migration

### If You Have Existing Recipe Data

The old system doesn't store recipes, but if you've built custom storage:

1. Export existing recipes
2. Transform to new schema:

```typescript
// Old format (if you stored it)
{
  dish: "Lasagna",
  recipe: "markdown text",
  sourceUrl: "https://..."
}

// New format
{
  userID: "user-123",
  recipeData: {
    title: "Lasagna",
    description: "Classic Italian lasagna",
    portions: "8 servings",
    ingredients: ["..."],
    instructions: ["..."],
    nutrition: {
      calories_per_portion: "400 kcal"
    },
    sourceUrl: "https://..."
  },
  isSaved: true
}
```

3. Import via API:
```bash
curl -X POST http://localhost:3000/api/generate-recipe \
  -H "Content-Type: application/json" \
  -d @recipe.json
```

## User Experience Considerations

### For Users Who Prefer Quick Search

Add a "Quick Search" mode to the chat:

```typescript
// In chat.tsx
const quickSearch = async (dishName: string) => {
  // Create conversation
  // Send single message with dish name
  // Immediately trigger recipe generation
  // Skip back-and-forth chat
};
```

### For Users Who Love Conversation

Keep the full chat experience as-is.

### Hybrid Approach

```typescript
// Add input field above chat
<View style={styles.quickSearchBar}>
  <TextInput 
    placeholder="Quick search: Enter dish name"
    onSubmitEditing={(e) => quickSearch(e.nativeEvent.text)}
  />
</View>
```

## Testing Migration

### Smoke Test Checklist

- [ ] Old recipe search still works (if keeping)
- [ ] Chat tab is accessible
- [ ] Can create conversations
- [ ] Can send messages
- [ ] "Find Recipe" button appears
- [ ] Recipe generation completes
- [ ] Recipes display correctly
- [ ] Can save/unsave recipes
- [ ] Navigation works between tabs
- [ ] No crashes or errors

### Regression Test Cases

1. **Old system**: Enter "lasagna" → Get recipe
2. **New system**: Chat → Discuss → Find Recipe → View
3. **Navigation**: Switch between all tabs
4. **Data**: Recipes persist across app restarts
5. **Error handling**: Invalid input, network errors

## Rollback Plan

If issues occur, quick rollback:

1. **Revert navigation**:
   ```bash
   git checkout HEAD -- apps/mobile/app/(tabs)/_layout.tsx
   ```

2. **Disable new routes**:
   ```typescript
   // In _layout.tsx, comment out new tabs
   // <Tabs.Screen name="chat" ... />
   // <Tabs.Screen name="recipes-new" ... />
   ```

3. **Restore old recipe screen**:
   ```bash
   git checkout HEAD -- apps/mobile/app/(tabs)/recipes.tsx
   ```

4. **Restart app**: `pnpm start --clear`

## Monitoring

Track these metrics during migration:

- Old recipe search usage
- Chat engagement (messages per conversation)
- Recipe generation success rate
- API error rates
- User retention
- Feature adoption rate

## Support Strategy

### Documentation
- Keep old documentation available
- Add "Classic Search" guide
- Migration FAQ

### User Communication
- Announce new feature
- Provide tutorial/walkthrough
- Offer feedback channel
- Monitor support tickets

### Gradual Rollout
1. Alpha: Internal testing
2. Beta: 10% of users
3. Staged: 50% of users
4. Full: 100% of users
5. Deprecation: Remove old system

## Recommended Approach

**For Development/Testing**: Keep both systems

**For Production**:
1. Deploy new system alongside old
2. Track usage for 2-4 weeks
3. Analyze user preferences
4. Make decision based on data
5. Deprecate less-used system

## Cost Considerations

### Old System
- Anthropic API calls only
- ~$0.001 per search
- No storage costs

### New System
- Anthropic API calls (3-4 per recipe)
- Cosmos DB storage (~$24/month base)
- More API compute time

**Optimization**:
- Cache search results
- Implement request throttling
- Use Azure free tier
- Monitor spending

## Questions to Ask

Before migrating, consider:

1. Do users want conversation or quick search?
2. Is database cost justified?
3. Do we need recipe storage?
4. Is current system meeting needs?
5. What's the ROI of new features?

## Conclusion

The new chat-driven system offers significantly more features but requires more infrastructure. Choose the migration path that best fits your:

- User needs
- Budget constraints
- Development resources
- Product roadmap

**Recommendation**: Start with Path 1 (keep both) to validate the new system before fully committing.

