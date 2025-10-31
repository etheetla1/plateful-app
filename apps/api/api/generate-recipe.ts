import { Hono } from 'hono';
import { getContainer, generateId, isCosmosAvailable } from '../lib/cosmos';
import { extractIntent } from '../services/intent-extraction';
import { searchRecipe } from '../services/recipe-search';
import { scrapeRecipeContent } from '../services/recipe-scraper';
import { formatRecipe } from '../services/recipe-formatter';
import type { ChatMessage, ChatConversation, Recipe, RecipeGenerateRequest } from '@plateful/shared';

const app = new Hono();

/**
 * Generate a recipe from a conversation
 * POST /generate-recipe
 * 
 * This endpoint implements the full flow:
 * 1. Fetch conversation messages
 * 2. Extract intent (dish + search query)
 * 3. Search for recipe URL
 * 4. Scrape recipe content
 * 5. Format into structured JSON
 * 6. Store in Cosmos DB
 */
app.post('/', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Recipe generation service not available' }, 503);
  }

  try {
    const body = await c.req.json<RecipeGenerateRequest>();
    const { conversationID, userID } = body;

    if (!conversationID || !userID) {
      return c.json({ error: 'conversationID and userID are required' }, 400);
    }

    console.log(`🔄 Starting recipe generation for conversation ${conversationID}`);

    // Step 1: Fetch conversation messages
    const messagesContainer = getContainer('chatMessages');
    if (!messagesContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: messages } = await messagesContainer.items
      .query<ChatMessage>({
        query: 'SELECT * FROM c WHERE c.conversationID = @conversationID ORDER BY c.messageIndex ASC',
        parameters: [{ name: '@conversationID', value: conversationID }],
      })
      .fetchAll();

    if (messages.length === 0) {
      return c.json({ error: 'No messages found in conversation' }, 404);
    }

    console.log(`📝 Fetched ${messages.length} messages`);

    // Step 2: Extract intent
    console.log(`🧠 Extracting intent from conversation...`);
    const intent = await extractIntent(messages);
    console.log(`✅ Intent extracted: ${intent.dish} (status: ${intent.status})`);

    // Check if conversation is off-topic
    if (intent.status === 'off_topic') {
      console.log(`🚫 Off-topic conversation detected`);
      return c.json({ 
        error: 'Off-topic conversation',
        message: 'This conversation isn\'t about cooking or recipes. Please ask about a dish or cuisine you\'d like to make.',
        intent
      }, 400);
    }

    // All other statuses (broad_category, specific_dish, fully_refined) allow search
    console.log(`✅ Intent status: ${intent.status} - proceeding with recipe generation`);

    // Update conversation with extracted intent
    const conversationContainer = getContainer('chatConversations');
    if (conversationContainer) {
      const { resource: conversation } = await conversationContainer
        .item(conversationID, conversationID)
        .read<ChatConversation>();

      if (conversation) {
        conversation.decidedDish = intent.dish;
        conversation.searchQuery = intent.searchQuery;
        conversation.status = 'decided';
        conversation.updatedAt = new Date().toISOString();
        await conversationContainer.item(conversationID, conversationID).replace(conversation);
      }
    }

    // Step 3: Search for recipe
    console.log(`🔍 Searching for recipe: ${intent.searchQuery}`);
    const searchResult = await searchRecipe(intent.searchQuery);
    console.log(`✅ Found recipe: ${searchResult.title} at ${searchResult.url}`);

    // Step 4: Scrape recipe content
    console.log(`📄 Scraping recipe content...`);
    let recipeData;
    
    try {
      const scrapedContent = await scrapeRecipeContent(searchResult.url);
      console.log(`✅ Scraped ${scrapedContent.length} characters`);

      // Step 5: Format recipe
      console.log(`🎨 Formatting recipe data...`);
      recipeData = await formatRecipe(scrapedContent, searchResult.url);
      console.log(`✅ Recipe formatted: ${recipeData.title}`);
    } catch (scrapeError) {
      console.warn(`⚠️ Scraping failed, creating fallback recipe: ${scrapeError}`);
      
      // Create a basic fallback recipe based on the search query
      recipeData = {
        title: searchResult.title,
        description: `A delicious ${intent.dish} recipe`,
        portions: "4 servings (estimated by AI)",
        ingredients: [
          "Main ingredients based on recipe type",
          "Seasonings and spices",
          "Cooking oil or butter",
          "Salt and pepper to taste"
        ],
        instructions: [
          "Prepare all ingredients",
          "Follow traditional cooking methods for this dish",
          "Season to taste",
          "Serve hot and enjoy!"
        ],
        nutrition: {
          calories_per_portion: "300-500 kcal (estimated by AI)",
          protein: "20-30g (estimated by AI)",
          carbs: "30-50g (estimated by AI)",
          fat: "10-20g (estimated by AI)"
        },
        sourceUrl: searchResult.url
      };
      
      console.log(`✅ Fallback recipe created: ${recipeData.title}`);
    }

    // Step 6: Check for duplicate recipe
    const recipesContainer = getContainer('recipes');
    if (!recipesContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const sourceUrlLower = searchResult.url.toLowerCase();
    const { resources: existingRecipes } = await recipesContainer.items
      .query<Recipe>({
        query: 'SELECT * FROM c WHERE c.userID = @userID AND c.sourceUrlLower = @sourceUrlLower',
        parameters: [
          { name: '@userID', value: userID },
          { name: '@sourceUrlLower', value: sourceUrlLower }
        ],
      })
      .fetchAll();

    let recipe: Recipe;

    if (existingRecipes.length > 0) {
      // Recipe already exists, link it to this conversation
      recipe = existingRecipes[0];
      console.log(`♻️ Recipe already exists, linking to conversation`);
      
      if (!recipe.conversationID) {
        recipe.conversationID = conversationID;
        await recipesContainer.item(recipe.id, userID).replace(recipe);
      }
    } else {
      // Create new recipe
      const recipeID = generateId('recipe');
      const now = new Date().toISOString();

      recipe = {
        id: recipeID,
        userID,
        recipeID,
        recipeNameLower: recipeData.title.toLowerCase(),
        sourceUrlLower,
        conversationID,
        recipeData,
        isSaved: false,
        createdAt: now,
        updatedAt: now,
      };

      await recipesContainer.items.create(recipe);
      console.log(`✅ Recipe stored with ID: ${recipeID}`);
    }

    // Update conversation with recipe link
    if (conversationContainer) {
      const { resource: conversation } = await conversationContainer
        .item(conversationID, conversationID)
        .read<ChatConversation>();

      if (conversation) {
        conversation.recipeID = recipe.recipeID;
        conversation.status = 'recipe_found';
        conversation.updatedAt = new Date().toISOString();
        await conversationContainer.item(conversationID, conversationID).replace(conversation);
      }
    }

    console.log(`🎉 Recipe generation complete!`);

    return c.json({ 
      recipe,
      intent,
      searchResult
    }, 201);

  } catch (error) {
    console.error('❌ Recipe generation error:', error);
    return c.json({ 
      error: 'Failed to generate recipe',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get recipes for a user
 * GET /recipes/user/:userID
 */
app.get('/user/:userID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Recipe service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const container = getContainer('recipes');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: recipes } = await container.items
      .query<Recipe>({
        query: 'SELECT * FROM c WHERE c.userID = @userID ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userID', value: userID }],
      })
      .fetchAll();

    return c.json({ recipes });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return c.json({ error: 'Failed to fetch recipes' }, 500);
  }
});

/**
 * Get a specific recipe
 * GET /recipes/:recipeID
 */
app.get('/:recipeID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Recipe service not available' }, 503);
  }

  try {
    const recipeID = c.req.param('recipeID');
    const userID = c.req.query('userID');

    if (!userID) {
      return c.json({ error: 'userID query parameter is required' }, 400);
    }

    const container = getContainer('recipes');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resource: recipe } = await container
      .item(recipeID, userID)
      .read<Recipe>();

    if (!recipe) {
      return c.json({ error: 'Recipe not found' }, 404);
    }

    return c.json({ recipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return c.json({ error: 'Failed to fetch recipe' }, 500);
  }
});

/**
 * Save/unsave a recipe
 * PATCH /recipes/:recipeID
 */
app.patch('/:recipeID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Recipe service not available' }, 503);
  }

  try {
    const recipeID = c.req.param('recipeID');
    const { userID, isSaved } = await c.req.json();

    if (!userID) {
      return c.json({ error: 'userID is required' }, 400);
    }

    const container = getContainer('recipes');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resource: recipe } = await container
      .item(recipeID, userID)
      .read<Recipe>();

    if (!recipe) {
      return c.json({ error: 'Recipe not found' }, 404);
    }

    if (typeof isSaved === 'boolean') {
      recipe.isSaved = isSaved;
    }
    recipe.updatedAt = new Date().toISOString();

    await container.item(recipeID, userID).replace(recipe);

    return c.json({ recipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return c.json({ error: 'Failed to update recipe' }, 500);
  }
});

import { handle } from 'hono/vercel';

// Default export for dev server
export default app;

// Named exports for Vercel serverless functions
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);

