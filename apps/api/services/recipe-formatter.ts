import Anthropic from '@anthropic-ai/sdk';
import type { RecipeData } from '@plateful/shared';

/**
 * Format scraped recipe content into structured JSON
 */
export async function formatRecipe(scrapedContent: string, sourceUrl: string): Promise<RecipeData> {
  // Initialize client with current environment variables
  const client = new Anthropic({ 
    apiKey: process.env.ANTHROPIC_API_KEY 
  });

  const prompt = `You are a recipe formatter. Your task is to extract and structure recipe information from scraped web content.

IMPORTANT RULES:
1. Do NOT generate or invent recipes
2. Extract ONLY information present in the source content
3. Remove ads, stories, commentary, and irrelevant text
4. If serving count is missing, estimate it and mark as "(estimated by AI)"
5. If nutrition data is missing, estimate it and mark as "(estimated by AI)"
6. Calories MUST be per portion, not total
7. Keep ingredients and instructions concise and clear

Scraped content from ${sourceUrl}:
---
${scrapedContent.substring(0, 8000)}
---

Return a JSON object with this EXACT structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "portions": "Number of servings (e.g., '4 servings' or '4 servings (estimated by AI)')",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "nutrition": {
    "calories_per_portion": "XXX kcal or XXX kcal (estimated by AI)",
    "protein": "XXg or XXg (estimated by AI)",
    "carbs": "XXg or XXg (estimated by AI)",
    "fat": "XXg or XXg (estimated by AI)"
  },
  "sourceUrl": "${sourceUrl}"
}

Return ONLY the JSON object, no other text.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
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

  try {
    // Remove markdown code blocks if present
    const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
    const recipeData: RecipeData = JSON.parse(cleanedText);
    
    // Validate required fields
    if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions || !recipeData.portions) {
      throw new Error('Missing required recipe fields');
    }

    // Ensure sourceUrl is set
    recipeData.sourceUrl = sourceUrl;

    // Ensure nutrition object exists
    if (!recipeData.nutrition) {
      recipeData.nutrition = {
        calories_per_portion: 'Not available (estimated by AI)'
      };
    }

    return recipeData;
  } catch (error) {
    console.error('Failed to parse formatted recipe:', resultText);
    throw new Error('Failed to format recipe data');
  }
}

