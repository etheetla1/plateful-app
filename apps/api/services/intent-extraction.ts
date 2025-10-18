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

  const prompt = `You are analyzing a conversation about food and meal planning. Based on the conversation below, determine if the user has provided a specific dish name.

Conversation:
${conversationText}

Please respond with a JSON object in this exact format:
{
  "dish": "Specific dish name OR 'Not yet decided'",
  "searchQuery": "detailed search query for finding recipe OR 'Unable to provide - user has not selected a specific dish'",
  "status": "decided" OR "still_deciding"
}

IMPORTANT RULES:
- If the user has mentioned a specific dish name (like "beef stroganoff", "pasta", "chicken curry", etc.), set dish to that exact name and status to "decided"
- Only set status to "still_deciding" if the user is genuinely exploring multiple options without naming a specific dish
- The AI asking follow-up questions does NOT mean the user hasn't decided - they may just want to refine the recipe
- The searchQuery should be detailed and optimized for finding authentic recipes when a specific dish is mentioned
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
      status: result.status || (result.dish === 'Not yet decided' || result.dish === 'Unable to provide - user has not selected a specific dish' ? 'still_deciding' : 'decided')
    };

    return intentResult;
  } catch (error) {
    console.error('Failed to parse intent extraction result:', resultText);
    throw new Error('Failed to extract intent from conversation');
  }
}

