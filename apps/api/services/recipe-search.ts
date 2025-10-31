import Anthropic from '@anthropic-ai/sdk';
import type { RecipeSearchResult, FoodProfile } from '@plateful/shared';

/**
 * Search for a recipe using Anthropic's web search
 */
export async function searchRecipe(searchQuery: string, profile?: FoodProfile | null): Promise<RecipeSearchResult> {
  // Initialize client with current environment variables
  const client = new Anthropic({ 
    apiKey: process.env.ANTHROPIC_API_KEY 
  });

  console.log(`Searching for recipe: ${searchQuery}`);

  // Build dietary restrictions context for search
  let restrictionsNote = '';
  if (profile) {
    const restrictions: string[] = [];
    if (profile.allergens && profile.allergens.length > 0) {
      restrictions.push(`allergen-free: ${profile.allergens.join(', ')}`);
    }
    if (profile.restrictions && profile.restrictions.length > 0) {
      restrictions.push(`without: ${profile.restrictions.join(', ')}`);
    }
    if (restrictions.length > 0) {
      restrictionsNote = `\n\nIMPORTANT: The recipe must be ${restrictions.join(', ')}. Filter out any recipes that contain these.`;
    }
  }

  const response = await (client.messages.create as any)({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        // Block problematic domains that return 403 errors
        blocked_domains: [
          "thekitchn.com",
          "foodnetwork.com", 
          "tasty.co",
          "buzzfeed.com",
          "showmetheyummy.com",
          "tastesbetterfromscratch.com",
          "allrecipes.com",
          "food.com",
          "epicurious.com",
          "bonappetit.com"
        ],
        // Prefer reliable recipe sites
      }
    ],
    messages: [{
      role: "user",
      content: `Search for: ${searchQuery}${restrictionsNote}


Find a specific recipe page URL (not a homepage or category page) from any reliable cooking website.

IMPORTANT: Return a URL to a specific recipe page that contains ingredients and instructions, NOT a homepage or category listing page.

Return ONLY a JSON object with this structure:
{
  "title": "Recipe title",
  "url": "Full URL to the specific recipe page (not homepage)",
  "snippet": "Brief description"
}

Important: Return ONLY the JSON object, no other text.`
    }]
  });

  // Extract the response text
  let resultText = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      resultText += block.text;
    }
  }

  try {
    // Remove markdown code blocks if present
    const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
    
    // Try to parse as JSON first
    const result: RecipeSearchResult = JSON.parse(cleanedText);
    
    if (!result.url || !result.title) {
      throw new Error('Invalid search result format');
    }

    return result;
  } catch (parseError) {
    // Fallback: Try to extract URL from text
    console.warn('Failed to parse search result as JSON, attempting URL extraction');
    
    const urlMatch = resultText.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/);
    if (urlMatch) {
      return {
        title: searchQuery,
        url: urlMatch[0],
        snippet: 'Recipe found via web search'
      };
    }

    throw new Error('No recipe URL found in search results');
  }
}

