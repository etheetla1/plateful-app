import type { VercelRequest, VercelResponse } from '@vercel/node';

// Global storage that persists across function calls within the same instance
declare global {
  var chatConversations: any[] | undefined;
  var chatMessages: any[] | undefined;
}

// Initialize global storage if not exists
if (!global.chatConversations) {
  global.chatConversations = [];
}
if (!global.chatMessages) {
  global.chatMessages = [];
}

const conversations = global.chatConversations;
const messages = global.chatMessages;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const urlPath = url?.split('?')[0] || '';

  try {
    // Handle different chat operations using query parameters
    const { action, conversationID } = req.query;
    
    // GET /api/chat?action=messages&conversationID=xxx - Get messages for conversation
    if (method === 'GET' && action === 'messages' && conversationID) {
      console.log(`📥 Loading messages for conversation: ${conversationID}`);
      console.log(`📊 Total messages in storage: ${messages.length}`);
      
      const conversationMessages = messages.filter(m => m.conversationID === conversationID);
      console.log(`📋 Found ${conversationMessages.length} messages for conversation ${conversationID}`);
      
      return res.status(200).json({
        messages: conversationMessages
      });
    }

    // GET /api/chat?action=conversation&conversationID=xxx - Get conversation details
    if (method === 'GET' && action === 'conversation' && conversationID) {
      const conversation = conversations.find(c => c.conversationID === conversationID);
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      return res.status(200).json({ conversation });
    }
    
    // GET /api/chat - List conversations (default when no action specified)
    if (method === 'GET' && urlPath === '/api/chat' && !action) {
      return res.status(200).json({
        conversations: conversations.length > 0 ? conversations : [
          {
            id: 'conv-1',
            userID: 'mock-user-id',
            title: 'Recipe Suggestions',
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                content: 'What can I make with chicken and broccoli?',
                timestamp: new Date().toISOString(),
              },
              {
                id: 'msg-2',
                role: 'assistant',
                content: 'Here are some great options with chicken and broccoli:\n\n1. **Chicken and Broccoli Stir Fry** - Quick and healthy\n2. **Chicken Broccoli Casserole** - Comfort food classic\n3. **Chicken Broccoli Alfredo** - Creamy pasta dish\n\nWould you like a detailed recipe for any of these?',
                timestamp: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
      });
    }
    
    // POST /api/chat?action=conversation - Create new conversation
    if (method === 'POST' && action === 'conversation') {
      const { userID } = req.body;
      const newConversationID = `conv-${Date.now()}`;
      
      const newConversation = {
        conversationID: newConversationID,
        userID: userID || 'mock-user-id',
        title: 'New Recipe Chat',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      conversations.push(newConversation);
      
      return res.status(200).json({
        conversation: newConversation
      });
    }


    // POST /api/chat?action=message - Send message
    if (method === 'POST' && action === 'message') {
      const { conversationID: bodyConversationID, role, content } = req.body;
      
      if (!bodyConversationID || !role || !content) {
        return res.status(400).json({ error: 'Missing required fields: conversationID, role, content' });
      }
      
      const messageID = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newMessage = {
        id: messageID,
        conversationID: bodyConversationID,
        role,
        content,
        timestamp: new Date().toISOString(),
      };
      
      messages.push(newMessage);
      
      return res.status(200).json({
        message: newMessage
      });
    }

    // POST /api/chat?action=ai-response - Get AI response
    if (method === 'POST' && action === 'ai-response') {
      const { conversationID: bodyConversationID, userID } = req.body;
      
      if (!bodyConversationID || !userID) {
        return res.status(400).json({ error: 'Missing required fields: conversationID, userID' });
      }
      
      // Get the conversation messages to understand context
      const conversationMessages = messages.filter(m => m.conversationID === bodyConversationID);
      const lastUserMessage = conversationMessages
        .filter(m => m.role === 'user')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      let response = "I'm here to help you discover delicious recipes! What are you in the mood for?";
      
      if (lastUserMessage) {
        const userContent = lastUserMessage.content.toLowerCase();
        
        // Check for specific recipe requests
        if (userContent.includes('alfredo') || userContent.includes('chicken alfredo')) {
          response = "**Chicken Alfredo** is such a classic! 🍝 Here's what makes it amazing:\n\n" +
                    "• **Creamy garlic parmesan sauce** - rich and indulgent\n" +
                    "• **Tender chicken breast** - perfectly seasoned\n" +
                    "• **Fresh fettuccine pasta** - the perfect base\n" +
                    "• **Takes about 25 minutes** to make\n\n" +
                    "I can generate a complete recipe with detailed instructions, ingredient measurements, and nutrition info! Just tap the **✨ Find Recipe** button below when you're ready. 👇";
        }
        else if (userContent.includes('stir fry') || userContent.includes('stir-fry')) {
          response = "**Stir Fry** is perfect for a quick, healthy meal! 🥢 Here's why it's great:\n\n" +
                    "• **Super quick** - ready in 15-20 minutes\n" +
                    "• **Packed with vegetables** - colorful and nutritious\n" +
                    "• **High protein** - with chicken or your choice of protein\n" +
                    "• **Customizable** - use whatever veggies you have\n\n" +
                    "Ready for a complete recipe with exact measurements and cooking steps? Tap **✨ Find Recipe** below! 👇";
        }
        else if (userContent.includes('pasta')) {
          response = "**Pasta dishes** are so versatile and satisfying! 🍝 I can help you with:\n\n" +
                    "• **Creamy sauces** - like Alfredo or carbonara\n" +
                    "• **Tomato-based** - marinara, arrabbiata, or puttanesca\n" +
                    "• **Oil-based** - aglio e olio or pesto\n" +
                    "• **Baked dishes** - lasagna or baked ziti\n\n" +
                    "What type of pasta dish sounds good? I can generate a detailed recipe with the **✨ Find Recipe** button! 👇";
        }
        else if (userContent.includes('chicken')) {
          response = "**Chicken** is such a versatile protein! 🐔 Here are some delicious options:\n\n" +
                    "• **Grilled or baked** - simple and healthy\n" +
                    "• **Stir-fried** - quick with vegetables\n" +
                    "• **Creamy dishes** - like Chicken Alfredo\n" +
                    "• **Comfort food** - like chicken and rice\n\n" +
                    "What style of chicken dish are you craving? I can create a complete recipe for you with the **✨ Find Recipe** button! 👇";
        }
        else if (userContent.includes('recipe') || userContent.includes('cook') || userContent.includes('make')) {
          response = "I'd love to help you cook something delicious! 👨‍🍳 Here's how I can help:\n\n" +
                    "• **Tell me what you're craving** - any dish or cuisine\n" +
                    "• **Mention ingredients you have** - I'll suggest recipes\n" +
                    "• **Ask about cooking techniques** - I'll guide you\n" +
                    "• **Request specific dishes** - like pasta, stir fry, etc.\n\n" +
                    "Once we chat about what you want, I can generate a **complete recipe** with ingredients, instructions, and nutrition info using the **✨ Find Recipe** button! What sounds good to you? 🍽️";
        }
        else if (userContent.includes('healthy') || userContent.includes('nutrition')) {
          response = "**Healthy cooking** is fantastic! 🥗 I can help you with:\n\n" +
                    "• **High-protein meals** - great for fitness goals\n" +
                    "• **Vegetable-packed dishes** - colorful and nutritious\n" +
                    "• **Low-carb options** - like stir-fries and salads\n" +
                    "• **Balanced meals** - with proper macros\n\n" +
                    "All my recipes include **detailed nutrition information**! What type of healthy dish interests you? I can generate a complete recipe with the **✨ Find Recipe** button! 👇";
        }
        else {
          // Generic encouraging responses for other inputs
          const genericResponses = [
            "That sounds delicious! Tell me more about what you're in the mood for, and I can help you find the perfect recipe. 🍽️",
            "Great choice! What specific dish or flavors are you craving? I can generate detailed recipes with ingredients and instructions! 👨‍🍳",
            "I love helping with cooking! What type of cuisine or ingredients are you thinking about? Let's create something amazing together! ✨",
            "Perfect! Are you looking for something quick and easy, or do you want to try something more elaborate? I can help either way! 🍳",
            "Excellent! What cooking style appeals to you today - maybe something creamy, spicy, fresh, or comforting? 🌟"
          ];
          response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
        }
      }
      
      return res.status(200).json({
        response: response
      });
    }

    // POST /api/chat?action=save-edited-recipe - Save edited recipe
    if (method === 'POST' && action === 'save-edited-recipe') {
      const { conversationID: bodyConversationID, userID } = req.body;
      
      if (!bodyConversationID || !userID) {
        return res.status(400).json({ error: 'Missing required fields: conversationID, userID' });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Recipe saved successfully',
        recipeID: `recipe-${Date.now()}`
      });
    }

    // POST /api/chat?action=load-recipe - Load recipe into chat
    if (method === 'POST' && action === 'load-recipe') {
      const { conversationID: bodyConversationID, recipeID, userID } = req.body;
      
      if (!bodyConversationID || !recipeID || !userID) {
        return res.status(400).json({ error: 'Missing required fields: conversationID, recipeID, userID' });
      }
      
      // Mock loading a recipe into chat
      const welcomeMessage = {
        id: `msg-${Date.now()}`,
        conversationID: bodyConversationID,
        role: 'assistant',
        content: `I've loaded your recipe! Let's work together to customize it to your preferences. What would you like to change about this recipe?`,
        timestamp: new Date().toISOString(),
      };
      
      messages.push(welcomeMessage);
      
      return res.status(200).json({
        success: true,
        message: welcomeMessage
      });
    }

    // Default response for unmatched routes
    return res.status(404).json({ 
      error: 'Endpoint not found',
      method,
      path: urlPath,
      availableEndpoints: [
        'GET /api/chat',
        'POST /api/chat/conversation',
        'GET /api/chat/conversation/{id}',
        'GET /api/chat/messages/{conversationID}',
        'POST /api/chat/message',
        'POST /api/chat/ai-response',
        'POST /api/chat/save-edited-recipe',
        'POST /api/chat/load-recipe'
      ]
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}