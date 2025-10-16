import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY not found in environment variables');
  process.exit(1);
}

const client = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY 
});

const recipeFor = "lasagna";

async function searchAndExtractRecipe() {
  try {
    console.log(`Searching for ${recipeFor} recipe...\n`);
    
    // Use the server-side web_search tool
    const response = await (client.messages.create as any)({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ],
      messages: [{
        role: "user",
        content: `Search for a ${recipeFor} recipe on food52.com, find a real recipe, and provide it in markdown format with the source URL from food52.com.`
      }]
    });

    // Collect all text blocks and join them
    let recipeText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        recipeText += block.text;
      }
    }

    // Display the recipe
    console.log(recipeText);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the search and extraction
searchAndExtractRecipe();