import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, IntentExtractionResult } from '@plateful/shared';

/**
 * Extract the user's decided dish and generate a search query from the conversation
 */
export async function extractIntent(messages: ChatMessage[]): Promise<IntentExtractionResult> {
  // Initialize client with current environment variables
  const client = new Anthropic({ 
    apiKey: process.env.ANTHROPIC_API_KEY 
  });

  // Build conversation history
  const conversationText = messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
    .join('\n');

  const prompt = `You are analyzing a conversation about food and meal planning. Based on the conversation below, determine the user's intent and categorize it into one of four levels.

Conversation:
${conversationText}

Please respond with a JSON object in this exact format:
{
  "dish": "Specific dish name OR broad category OR 'Kitchen utility question' OR 'Not food-related'",
  "searchQuery": "detailed search query for finding recipe OR 'Not applicable - kitchen utility' OR 'Not applicable - off-topic conversation'",
  "status": "off_topic" OR "kitchen_utility" OR "broad_category" OR "specific_dish" OR "fully_refined",
  "certaintyLevel": "low" OR "medium" OR "high",
  "explanation": "Short summary with core details like 'Chinese food with onions, noodles' or 'Pan-seared fish, spicy'"
}

INTENT LEVELS:
- off_topic: Conversation is NOT about cooking, food, recipes, or kitchen-related topics (cement, sports, weather, conversions, etc.)
- kitchen_utility: Kitchen questions without recipe intent (unit conversions, technique explanations, "what is braising?")
- broad_category: Cuisine type, flavor profile, or cooking method for recipes (Chinese food, Italian, spicy, braising recipes)
- specific_dish: User mentioned a named dish (Kung Pao Chicken, lasagna, cheeseburger, pad thai)
- fully_refined: User mentioned a specific dish AND preferences/details (spicy Kung Pao, medium-rare burger, gluten-free pasta)

CERTAINTY LEVELS:
- low: broad_category status
- medium: specific_dish status  
- high: fully_refined status

KITCHEN-RELATED TOPICS (ALLOWED):
- Cooking methods: braise, sauté, grill, bake, etc.
- Ingredients: when discussed in cooking context
- Kitchen equipment: when used in cooking context
- Food preparation techniques

OFF-TOPIC EXAMPLES (BLOCK):
- Unit conversions (12 floz in ml)
- Non-food topics (cement, sports, weather)
- General questions not related to cooking

KITCHEN UTILITY EXAMPLES (ALLOW CONVERSATION, NO RECIPE BUTTON):
- "What is braising?"
- "How do I convert 12 floz to ml?"
- "What's the difference between sauté and stir-fry?"

EXPLANATION EXAMPLES:
- "Chinese food" (for broad categories)
- "Chinese food with onions, noodles" (when ingredients mentioned)
- "Pan-seared fish, spicy" (when preferences specified)
- "Kitchen utility question" (for conversions, techniques)

IMPORTANT RULES:
- If user mentions a dish and answers questions about it, they HAVE decided on that dish
- Broad categories like "Chinese food" are valid and should allow recipe search
- Only block conversations that are completely unrelated to cooking/food
- Kitchen utility questions should allow conversation but not show recipe button
- The searchQuery should be concise and optimized for web search (e.g., "Chinese recipes", "Italian pasta recipes", "braising recipes")
- Avoid verbose search queries with pending details - keep them simple and actionable
- The explanation should be SHORT but include core details - like "Chinese food with onions, noodles" or "Pan-seared fish, spicy" - give a hint of what's being considered
- DO NOT write long explanations about AI behavior or user analysis - just the food details
- Return ONLY the JSON object, no other text`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: prompt
    }]
  });

  // Extract JSON from response
  let resultText = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      resultText += block.text;
    }
  }

  // Parse the JSON response
  try {
    // Remove markdown code blocks if present
    const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
    const result: any = JSON.parse(cleanedText);
    
    if (!result.dish || !result.searchQuery) {
      throw new Error('Invalid intent extraction result');
    }

    // Handle both old and new format - be more permissive
    const intentResult: IntentExtractionResult = {
      dish: result.dish,
      searchQuery: result.searchQuery,
      status: result.status || (
        result.dish === 'Not yet decided' || 
        result.dish === 'Unable to provide - user has not selected a specific dish' ||
        result.dish === 'Not food-related' ||
        result.searchQuery === 'Unable to provide - user has not selected a specific dish' ||
        result.searchQuery === 'Not applicable - off-topic conversation'
          ? 'off_topic' 
          : result.dish.includes('food') || result.dish.includes('cuisine') || result.dish.includes('style')
            ? 'broad_category'
            : 'specific_dish'
      ),
      certaintyLevel: result.certaintyLevel || (
        result.status === 'broad_category' ? 'low' :
        result.status === 'specific_dish' ? 'medium' :
        result.status === 'fully_refined' ? 'high' : 'low'
      ),
      explanation: result.explanation || `${result.dish}`
    };

    console.log(`🧠 Intent extraction result:`, intentResult);
    return intentResult;
  } catch (error) {
    console.error('Failed to parse intent extraction result:', resultText);
    throw new Error('Failed to extract intent from conversation');
  }
}

