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

  const prompt = `You are analyzing a conversation about food and meal planning. Based on the conversation below, extract:
1. The specific dish the user has decided on
2. A search query optimized for finding an authentic recipe online

Conversation:
${conversationText}

Please respond with a JSON object in this exact format:
{
  "dish": "Exact dish name",
  "searchQuery": "detailed search query for finding recipe"
}

IMPORTANT RULES:
- The dish should be the specific meal the user decided on
- The searchQuery should be detailed and optimized for finding authentic recipes
- Include relevant descriptors (e.g., "authentic", "traditional", specific cuisine style)
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
    const result: IntentExtractionResult = JSON.parse(cleanedText);
    
    if (!result.dish || !result.searchQuery) {
      throw new Error('Invalid intent extraction result');
    }

    return result;
  } catch (error) {
    console.error('Failed to parse intent extraction result:', resultText);
    throw new Error('Failed to extract intent from conversation');
  }
}

