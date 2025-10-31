import { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';
import { getContainer, generateId, isCosmosAvailable } from '../lib/cosmos';
import type { ChatMessage, ChatConversation, ChatMessageCreateRequest, ConversationCreateRequest, FoodProfile, Recipe } from '@plateful/shared';

const app = new Hono();

/**
 * Create a new conversation
 * POST /chat/conversation
 */
app.post('/conversation', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const body = await c.req.json<ConversationCreateRequest>();
    const { userID } = body;

    if (!userID) {
      return c.json({ error: 'userID is required' }, 400);
    }

    const conversationID = generateId('conv');
    const now = new Date().toISOString();

    const conversation: ChatConversation = {
      id: conversationID,
      conversationID,
      userID,
      status: 'exploring',
      createdAt: now,
      updatedAt: now,
    };

    const container = getContainer('chatConversations');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    await container.items.create(conversation);

    return c.json({ conversation }, 201);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

/**
 * Get conversation by ID
 * GET /chat/conversation/:id
 */
app.get('/conversation/:id', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const conversationID = c.req.param('id');
    const container = getContainer('chatConversations');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resource: conversation } = await container
      .item(conversationID, conversationID)
      .read<ChatConversation>();

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    return c.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

/**
 * Update conversation status
 * PATCH /chat/conversation/:id
 */
app.patch('/conversation/:id', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const conversationID = c.req.param('id');
    const updates = await c.req.json();
    const container = getContainer('chatConversations');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resource: existing } = await container
      .item(conversationID, conversationID)
      .read<ChatConversation>();

    if (!existing) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    const updated: ChatConversation = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await container.item(conversationID, conversationID).replace(updated);

    return c.json({ conversation: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return c.json({ error: 'Failed to update conversation' }, 500);
  }
});

/**
 * Send a chat message
 * POST /chat/message
 */
app.post('/message', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const body = await c.req.json<ChatMessageCreateRequest>();
    const { conversationID, role, content } = body;

    if (!conversationID || !role || !content) {
      return c.json({ error: 'conversationID, role, and content are required' }, 400);
    }

    const messageContainer = getContainer('chatMessages');
    const conversationContainer = getContainer('chatConversations');
    
    if (!messageContainer || !conversationContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Get current message count for this conversation
    const { resources: existingMessages } = await messageContainer.items
      .query<ChatMessage>({
        query: 'SELECT * FROM c WHERE c.conversationID = @conversationID ORDER BY c.messageIndex DESC OFFSET 0 LIMIT 1',
        parameters: [{ name: '@conversationID', value: conversationID }],
      })
      .fetchAll();

    const messageIndex = existingMessages.length > 0 ? existingMessages[0].messageIndex + 1 : 0;
    const messageId = generateId('msg');

    const message: ChatMessage = {
      id: messageId,
      conversationID,
      messageIndex,
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    await messageContainer.items.create(message);

    // Update conversation's updatedAt timestamp
    const { resource: conversation } = await conversationContainer
      .item(conversationID, conversationID)
      .read<ChatConversation>();

    if (conversation) {
      conversation.updatedAt = new Date().toISOString();
      await conversationContainer.item(conversationID, conversationID).replace(conversation);
    }

    return c.json({ message }, 201);
  } catch (error) {
    console.error('Error creating message:', error);
    return c.json({ error: 'Failed to create message' }, 500);
  }
});

/**
 * Get all messages for a conversation
 * GET /chat/messages/:conversationID
 */
app.get('/messages/:conversationID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const conversationID = c.req.param('conversationID');
    const container = getContainer('chatMessages');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: messages } = await container.items
      .query<ChatMessage>({
        query: 'SELECT * FROM c WHERE c.conversationID = @conversationID ORDER BY c.messageIndex ASC',
        parameters: [{ name: '@conversationID', value: conversationID }],
      })
      .fetchAll();

    return c.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

/**
 * Get all conversations for a user
 * GET /chat/conversations/user/:userID
 */
app.get('/conversations/user/:userID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const container = getContainer('chatConversations');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: conversations } = await container.items
      .query<ChatConversation>({
        query: 'SELECT * FROM c WHERE c.userID = @userID ORDER BY c.updatedAt DESC',
        parameters: [{ name: '@userID', value: userID }],
      })
      .fetchAll();

    return c.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

/**
 * Generate AI response for a conversation
 * POST /chat/ai-response
 */
app.post('/ai-response', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const body = await c.req.json();
    const { conversationID, userID } = body;

    if (!conversationID) {
      return c.json({ error: 'conversationID is required' }, 400);
    }

    // Get conversation messages
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

    // Fetch user profile if userID is provided
    let profile: FoodProfile | null = null;
    if (userID) {
      const profileContainer = getContainer('userProfiles');
      if (profileContainer) {
        try {
          const { resource } = await profileContainer.item(userID, userID).read<FoodProfile>();
          profile = resource || null;
          if (profile) {
            console.log(`✅ User profile loaded: ${profile.restrictions.length} restrictions, ${profile.allergens.length} allergens`);
          }
        } catch (error) {
          console.log(`ℹ️ No profile found for user ${userID}`);
        }
      }
    }

    // Initialize Anthropic client
    const client = new Anthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY 
    });

    // Build conversation history for Claude
    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Check if conversation is in recipe editing mode
    const { resource: conversation } = await getContainer('chatConversations')
      ?.item(conversationID, conversationID)
      .read<ChatConversation>() || { resource: null };

    let recipeContext = '';
    if (conversation?.status === 'editing_recipe' && conversation.editingRecipeID && userID) {
      const recipesContainer = getContainer('recipes');
      if (recipesContainer) {
        try {
          const { resource: recipe } = await recipesContainer
            .item(conversation.editingRecipeID, userID)
            .read();
          if (recipe) {
            recipeContext = `\n\n📝 RECIPE EDITING MODE:\nYou are helping the user edit this recipe:\n` +
              `Title: ${recipe.recipeData.title}\n` +
              `Description: ${recipe.recipeData.description || 'N/A'}\n` +
              `Portions: ${recipe.recipeData.portions}\n` +
              `Ingredients: ${recipe.recipeData.ingredients.join(', ')}\n` +
              `Instructions: ${recipe.recipeData.instructions.join('; ')}\n\n` +
              `When the user requests changes, acknowledge them and describe the modified recipe. ` +
              `After the user confirms the edits, they will save it as a new recipe. ` +
              `DO NOT generate a new recipe from scratch - modify the existing one based on their requests.`;
          }
        } catch (error) {
          console.log('Could not load recipe context for editing');
        }
      }
    }

    // Build system prompt with strict dietary restrictions
    let systemPrompt = "You are a helpful recipe assistant for the Plateful app. Help users discover delicious recipes through friendly conversation. Ask follow-up questions to understand their preferences, suggest dishes, and guide them toward finding the perfect recipe. Keep responses conversational, helpful, and food-focused." + recipeContext;
    
    if (profile) {
      // CRITICAL: Build strict restriction enforcement
      const restrictions: string[] = [];
      const allergens: string[] = [];
      
      if (profile.restrictions && profile.restrictions.length > 0) {
        restrictions.push(...profile.restrictions);
      }
      if (profile.allergens && profile.allergens.length > 0) {
        allergens.push(...profile.allergens);
      }

      // Debug logging
      console.log(`📋 Profile restrictions: [${restrictions.join(', ')}]`);
      console.log(`🚨 Profile allergens: [${allergens.join(', ')}]`);

      if (restrictions.length > 0 || allergens.length > 0) {
        systemPrompt += `\n\n⚠️⚠️⚠️ CRITICAL DIETARY RESTRICTIONS - ABSOLUTE ENFORCEMENT REQUIRED ⚠️⚠️⚠️\n`;
        systemPrompt += `THESE RESTRICTIONS ARE NON-NEGOTIABLE AND MUST BE STRICTLY ENFORCED IN EVERY RESPONSE.\n`;
        systemPrompt += `VIOLATING THESE RESTRICTIONS IS UNACCEPTABLE AND DANGEROUS.\n\n`;
        
        if (restrictions.length > 0) {
          const restrictionsList = restrictions.map(r => r.toLowerCase());
          systemPrompt += `🚫 ABSOLUTELY FORBIDDEN FOODS/RESTRICTIONS: ${restrictions.join(', ').toUpperCase()}\n\n`;
          
          // Specific enforcement rules for common restrictions
          if (restrictionsList.includes('pescatarian')) {
            systemPrompt += `⚠️ PESCATARIAN RESTRICTION DETECTED:\n`;
            systemPrompt += `- FORBIDDEN: ALL meat (beef, pork, lamb, veal, etc.) and ALL poultry (chicken, turkey, duck, etc.)\n`;
            systemPrompt += `- ALLOWED: ONLY finned fish and plant-based ingredients\n`;
            
            // Check if shellfish allergy exists - if so, exclude shellfish from pescatarian options
            const hasShellfishAllergy = allergens.length > 0 && allergens.map(a => a.toLowerCase()).includes('shellfish');
            if (hasShellfishAllergy) {
              systemPrompt += `- IMPORTANT: Due to shellfish allergy, ONLY suggest finned fish (salmon, tuna, cod, etc.) - NEVER suggest shellfish\n`;
              systemPrompt += `- When suggesting proteins, ONLY mention: salmon, tuna, cod, halibut, etc. (finned fish only)\n`;
            } else {
              systemPrompt += `- When suggesting proteins, you may mention: fish, seafood, salmon, tuna, etc. (but verify no allergens are present)\n`;
            }
            systemPrompt += `- NEVER chicken, beef, pork, turkey, or any land animals\n`;
            systemPrompt += `- If listing protein options, ONLY list finned fish (if no shellfish allergy) or plant-based options\n\n`;
          }
          
          if (restrictionsList.includes('vegetarian')) {
            systemPrompt += `⚠️ VEGETARIAN RESTRICTION DETECTED:\n`;
            systemPrompt += `- FORBIDDEN: ALL meat, poultry, fish, and seafood\n`;
            systemPrompt += `- ALLOWED: ONLY plant-based ingredients, eggs, and dairy\n`;
            systemPrompt += `- NEVER suggest any animal flesh\n\n`;
          }
          
          if (restrictionsList.includes('vegan')) {
            systemPrompt += `⚠️ VEGAN RESTRICTION DETECTED:\n`;
            systemPrompt += `- FORBIDDEN: ALL animal products (meat, poultry, fish, seafood, eggs, dairy, honey)\n`;
            systemPrompt += `- ALLOWED: ONLY plant-based ingredients\n`;
            systemPrompt += `- NEVER suggest any animal-derived products\n\n`;
          }
          
          // Specific food restrictions
          if (restrictionsList.includes('pork')) {
            systemPrompt += `⚠️ PORK RESTRICTION: NEVER suggest pork, bacon, ham, prosciutto, sausage (if pork-based), or any pork products\n`;
          }
          if (restrictionsList.includes('beef')) {
            systemPrompt += `⚠️ BEEF RESTRICTION: NEVER suggest beef, steak, hamburgers, ground beef, or any beef products\n`;
          }
          if (restrictionsList.includes('poultry')) {
            systemPrompt += `⚠️ POULTRY RESTRICTION: NEVER suggest chicken, turkey, duck, or any poultry\n`;
          }
          
          systemPrompt += `\n🔒 MANDATORY ENFORCEMENT RULES:\n`;
          systemPrompt += `1. BEFORE suggesting ANY protein or dish, verify it complies with ALL restrictions above\n`;
          systemPrompt += `2. When listing options, ONLY list compliant options - DO NOT list forbidden items\n`;
          systemPrompt += `3. If user asks about a restricted food, respond: "I can't suggest [food] due to your dietary restrictions. How about [compliant alternative] instead?"\n`;
          systemPrompt += `4. NEVER suggest or even mention restricted foods as options\n`;
          systemPrompt += `5. This is a SAFETY and RESPECT issue - violations are UNACCEPTABLE\n\n`;
        }
        
        if (allergens.length > 0) {
          const allergensList = allergens.map(a => a.toLowerCase());
          systemPrompt += `\n\n🚨🚨🚨 CRITICAL ALLERGENS - LIFE-THREATENING SAFETY ISSUE 🚨🚨🚨\n`;
          systemPrompt += `THESE ALLERGENS CAN CAUSE SERIOUS HARM OR DEATH. ABSOLUTELY NO EXCEPTIONS.\n\n`;
          systemPrompt += `⚠️ ALLERGENS TO AVOID: ${allergens.join(', ').toUpperCase()}\n\n`;
          
          // Specific enforcement for common allergens
          if (allergensList.includes('shellfish')) {
            systemPrompt += `🚨 SHELLFISH ALLERGY DETECTED - EXTREME CAUTION REQUIRED:\n`;
            systemPrompt += `- ABSOLUTELY FORBIDDEN: ALL shellfish including shrimp, crab, lobster, crawfish, crayfish, prawns, scallops, mussels, clams, oysters, squid, octopus, calamari, and ANY seafood with a shell\n`;
            systemPrompt += `- NEVER suggest shrimp burgers, crab cakes, lobster rolls, seafood paella, or ANY dish containing shellfish\n`;
            systemPrompt += `- SAFE ALTERNATIVES: Fish (salmon, tuna, cod, etc.) and plant-based options are safe\n`;
            systemPrompt += `- If suggesting seafood, ONLY suggest finned fish - NEVER shellfish\n`;
            systemPrompt += `- Shrimp is a CRUSTACEAN and is ABSOLUTELY FORBIDDEN under shellfish allergy\n\n`;
          }
          
          if (allergensList.includes('nuts')) {
            systemPrompt += `🚨 NUT ALLERGY DETECTED:\n`;
            systemPrompt += `- FORBIDDEN: ALL tree nuts (almonds, walnuts, cashews, pistachios, etc.), peanuts, and nut-based ingredients\n`;
            systemPrompt += `- Check for hidden nuts in sauces, oils, and seasonings\n\n`;
          }
          
          if (allergensList.includes('dairy')) {
            systemPrompt += `🚨 DAIRY ALLERGY DETECTED:\n`;
            systemPrompt += `- FORBIDDEN: Milk, cheese, butter, cream, yogurt, and all dairy products\n`;
            systemPrompt += `- Use dairy-free alternatives in suggestions\n\n`;
          }
          
          if (allergensList.includes('eggs')) {
            systemPrompt += `🚨 EGG ALLERGY DETECTED:\n`;
            systemPrompt += `- FORBIDDEN: Eggs in any form (scrambled, baked, as binding agent, etc.)\n`;
            systemPrompt += `- Use egg-free alternatives for binding in recipes\n\n`;
          }
          
          if (allergensList.includes('fish')) {
            systemPrompt += `🚨 FISH ALLERGY DETECTED:\n`;
            systemPrompt += `- FORBIDDEN: ALL finned fish (salmon, tuna, cod, etc.)\n`;
            systemPrompt += `- Use plant-based or other protein alternatives\n\n`;
          }
          
          systemPrompt += `\n🚨 CRITICAL ALLERGEN ENFORCEMENT RULES:\n`;
          systemPrompt += `1. ALLERGENS ARE MORE DANGEROUS THAN RESTRICTIONS - THIS IS A LIFE SAFETY ISSUE\n`;
          systemPrompt += `2. BEFORE suggesting ANY recipe, ingredient, or dish, verify it contains ZERO allergens\n`;
          systemPrompt += `3. When listing protein or ingredient options, ABSOLUTELY EXCLUDE all allergenic items\n`;
          systemPrompt += `4. If user asks about an allergenic food, respond: "I can't suggest [food] because you're allergic to [allergen]. This could be dangerous. How about [safe alternative] instead?"\n`;
          systemPrompt += `5. NEVER mention allergenic foods even as "alternatives you could try" - they are completely off-limits\n`;
          systemPrompt += `6. This is a MEDICAL SAFETY issue - violations could cause serious harm\n\n`;
        }

        systemPrompt += `\n🔒 FINAL MANDATORY ENFORCEMENT RULES (APPLY TO BOTH RESTRICTIONS AND ALLERGENS):\n`;
        systemPrompt += `1. BEFORE suggesting ANY protein, ingredient, or dish, verify it complies with ALL restrictions AND allergens above\n`;
        systemPrompt += `2. When listing options, ONLY list compliant and safe options - DO NOT list forbidden or allergenic items\n`;
        systemPrompt += `3. If user asks about a restricted/allergenic food, immediately decline and suggest a safe alternative\n`;
        systemPrompt += `4. NEVER suggest, mention, or even hint at restricted/allergenic foods as options\n`;
        systemPrompt += `5. This is a SAFETY and RESPECT issue - violations are UNACCEPTABLE and DANGEROUS\n\n`;
      }

      // Optional: Add preferences (likes/dislikes) for personalization
      if (profile.likes && profile.likes.length > 0) {
        systemPrompt += `\n✅ User prefers: ${profile.likes.join(', ')}. You can emphasize these preferences when relevant.\n`;
      }
      if (profile.dislikes && profile.dislikes.length > 0) {
        systemPrompt += `\n❌ User dislikes: ${profile.dislikes.join(', ')}. Avoid emphasizing these.\n`;
      }

      // Add cooking proficiency to system prompt
      if (profile.cookingProficiency) {
        const proficiencyLabels: Record<number, string> = {
          1: 'Beginner',
          2: 'Novice',
          3: 'Intermediate',
          4: 'Experienced',
          5: 'Advanced',
        };
        const proficiencyLabel = proficiencyLabels[profile.cookingProficiency] || profile.cookingProficiency.toString();
        systemPrompt += `\n👨‍🍳 User cooking skill level: ${proficiencyLabel} (${profile.cookingProficiency}/5). Adjust recipe complexity and instructions accordingly. For beginners, provide more detailed step-by-step instructions. For advanced cooks, you can assume knowledge of techniques and terminology.\n`;
      }
    }

    // Generate AI response using Claude
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: conversationHistory
    });

    // Extract the AI response
    let aiResponse = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        aiResponse += block.text;
      }
    }

    return c.json({ response: aiResponse });

  } catch (error) {
    console.error('Error generating AI response:', error);
    return c.json({ error: 'Failed to generate AI response' }, 500);
  }
});

/**
 * Load a recipe into chat for editing
 * POST /chat/load-recipe
 */
app.post('/load-recipe', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const body = await c.req.json();
    const { conversationID, recipeID, userID } = body;

    if (!conversationID || !recipeID || !userID) {
      return c.json({ error: 'conversationID, recipeID, and userID are required' }, 400);
    }

    const conversationContainer = getContainer('chatConversations');
    const recipesContainer = getContainer('recipes');
    
    if (!conversationContainer || !recipesContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify recipe exists and belongs to user
    const { resource: recipe } = await recipesContainer
      .item(recipeID, userID)
      .read();
    
    if (!recipe) {
      return c.json({ error: 'Recipe not found' }, 404);
    }

    if (recipe.userID !== userID) {
      return c.json({ error: 'Unauthorized: Recipe does not belong to user' }, 403);
    }

    // Update conversation with recipe editing context
    const { resource: conversation } = await conversationContainer
      .item(conversationID, conversationID)
      .read<ChatConversation>();

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    conversation.status = 'editing_recipe';
    conversation.editingRecipeID = recipeID;
    conversation.updatedAt = new Date().toISOString();
    await conversationContainer.item(conversationID, conversationID).replace(conversation);

    // Send initial message about the recipe
    const messageContainer = getContainer('chatMessages');
    if (messageContainer) {
      // Get current message count
      const { resources: existingMessages } = await messageContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.conversationID = @conversationID ORDER BY c.messageIndex DESC OFFSET 0 LIMIT 1',
          parameters: [{ name: '@conversationID', value: conversationID }],
        })
        .fetchAll();

      const messageIndex = existingMessages.length > 0 ? existingMessages[0].messageIndex + 1 : 0;
      const messageId = generateId('msg');

      const message = {
        id: messageId,
        conversationID,
        messageIndex,
        role: 'assistant',
        content: `I've loaded your recipe "${recipe.recipeData.title}". How would you like to modify it? For example, you can ask me to make it vegetarian, adjust the servings, change ingredients, or modify the instructions.`,
        timestamp: new Date().toISOString(),
      };

      await messageContainer.items.create(message);
    }

    return c.json({ 
      success: true, 
      conversation,
      recipe: {
        id: recipe.recipeID,
        title: recipe.recipeData.title,
      }
    }, 200);
  } catch (error) {
    console.error('Error loading recipe into chat:', error);
    return c.json({ error: 'Failed to load recipe into chat' }, 500);
  }
});

/**
 * Save edited recipe as a new recipe
 * POST /chat/save-edited-recipe
 */
app.post('/save-edited-recipe', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const body = await c.req.json();
    const { conversationID, userID } = body;

    if (!conversationID || !userID) {
      return c.json({ error: 'conversationID and userID are required' }, 400);
    }

    const conversationContainer = getContainer('chatConversations');
    const recipesContainer = getContainer('recipes');
    const messagesContainer = getContainer('chatMessages');
    
    if (!conversationContainer || !recipesContainer || !messagesContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Get conversation
    const { resource: conversation } = await conversationContainer
      .item(conversationID, conversationID)
      .read<ChatConversation>();

    if (!conversation || conversation.status !== 'editing_recipe' || !conversation.editingRecipeID) {
      return c.json({ error: 'No recipe being edited in this conversation' }, 400);
    }

    // Get original recipe
    const { resource: originalRecipe } = await recipesContainer
      .item(conversation.editingRecipeID, userID)
      .read();

    if (!originalRecipe) {
      return c.json({ error: 'Original recipe not found' }, 404);
    }

    // Get conversation messages
    const { resources: messages } = await messagesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.conversationID = @conversationID ORDER BY c.messageIndex ASC',
        parameters: [{ name: '@conversationID', value: conversationID }],
      })
      .fetchAll();

    if (messages.length === 0) {
      return c.json({ error: 'No messages in conversation' }, 400);
    }

    // Get user profile for formatting
    let profile: FoodProfile | null = null;
    const profileContainer = getContainer('userProfiles');
    if (profileContainer) {
      try {
        const { resource } = await profileContainer.item(userID, userID).read<FoodProfile>();
        profile = resource || null;
      } catch (error) {
        // Profile not found, continue without it
      }
    }

    // Use recipe formatter to extract modified recipe from conversation
    // Build a prompt that includes the full conversation
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const { formatRecipe } = await import('../services/recipe-formatter');
    
    // Create a synthetic scraped content from the conversation
    // The AI has already described the modified recipe in the conversation
    const scrapedContent = `Modified Recipe Conversation:\n\n${conversationText}\n\n` +
      `Original Recipe:\n` +
      `Title: ${originalRecipe.recipeData.title}\n` +
      `Description: ${originalRecipe.recipeData.description}\n` +
      `Portions: ${originalRecipe.recipeData.portions}\n` +
      `Ingredients: ${originalRecipe.recipeData.ingredients.join(', ')}\n` +
      `Instructions: ${originalRecipe.recipeData.instructions.join('; ')}`;

    // Format the modified recipe
    const modifiedRecipeData = await formatRecipe(scrapedContent, originalRecipe.recipeData.sourceUrl, profile);

    // Preserve image URL from original (always keep it, we'll add an "Edited" banner in UI)
    if (!modifiedRecipeData.imageUrl && originalRecipe.recipeData.imageUrl) {
      modifiedRecipeData.imageUrl = originalRecipe.recipeData.imageUrl;
    }

    // Create new recipe (don't overwrite original)
    const recipeID = generateId('recipe');
    const now = new Date().toISOString();

    const newRecipe: Recipe = {
      id: recipeID,
      userID,
      recipeID,
      recipeNameLower: modifiedRecipeData.title.toLowerCase(),
      sourceUrlLower: originalRecipe.sourceUrlLower,
      recipeData: modifiedRecipeData,
      isSaved: false,
      isEdited: true, // Mark as edited
      originalRecipeID: originalRecipe.recipeID, // Link to original
      createdAt: now,
      updatedAt: now,
    };

    await recipesContainer.items.create(newRecipe);

    // Update conversation status
    conversation.status = 'recipe_found';
    conversation.recipeID = recipeID;
    conversation.updatedAt = new Date().toISOString();
    await conversationContainer.item(conversationID, conversationID).replace(conversation);

    console.log(`✅ Edited recipe saved as new recipe: ${recipeID}`);

    return c.json({ 
      recipe: newRecipe,
      message: 'Recipe saved successfully!'
    }, 201);
  } catch (error) {
    console.error('Error saving edited recipe:', error);
    return c.json({ error: 'Failed to save edited recipe' }, 500);
  }
});

export default app;

