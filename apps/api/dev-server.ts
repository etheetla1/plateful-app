import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { initCosmosDB, isCosmosAvailable } from './lib/cosmos';

// Import API routes
import chatRoutes from './api/chat';
import mockChatRoutes from './api/mock-chat';
import generateRecipeRoutes from './api/generate-recipe';

// Load environment variables
dotenv.config();

// Initialize Cosmos DB
initCosmosDB();

const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083', 'http://10.0.2.2:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Mount API routes - use mock chat if Cosmos DB is not configured
if (isCosmosAvailable()) {
  console.log('✅ Using real Cosmos DB chat routes');
  app.route('/api/chat', chatRoutes);
} else {
  console.log('🎭 Cosmos DB not configured. Using mock chat routes for development.');
  app.route('/api/chat', mockChatRoutes);
}

app.route('/api/generate-recipe', generateRecipeRoutes);

// Initialize Anthropic client
const client = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY 
});

// Web scraper function
async function scrapeRecipeContent(url: string): Promise<string> {
  try {
    console.log(`Scraping content from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, nav, header, footer, .advertisement, .ads').remove();
    
    // Try to find recipe-specific content
    let content = '';
    
    // Look for common recipe content selectors
    const recipeSelectors = [
      '.recipe-content',
      '.recipe-body',
      '.recipe-instructions',
      '.recipe-ingredients',
      '.recipe-details',
      '.post-content',
      '.entry-content',
      '.content',
      'main',
      'article'
    ];
    
    for (const selector of recipeSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 500) { // Only use if substantial content
          break;
        }
      }
    }
    
    // Fallback to body content if no specific recipe content found
    if (!content || content.length < 500) {
      content = $('body').text().trim();
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    console.log(`Scraped ${content.length} characters from ${url}`);
    return content;
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    throw new Error(`Failed to scrape content from ${url}`);
  }
}

app.post('/api/recipe', async (c) => {
  try {
    const { dish } = await c.req.json();
    
    if (!dish) {
      return c.json({ error: 'Dish name is required' }, 400);
    }

    console.log(`Searching for ${dish} recipe...`);
    
    // Step 1: Use web search to find recipe URLs
    const searchResponse = await (client.messages.create as any)({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ],
      messages: [{
        role: "user",
        content: `Search for a ${dish} recipe on food52.com and return ONLY the URL of the best recipe page. Do not provide any other content, just the URL.`
      }]
    });

    // Extract URL from search response
    let recipeUrl = '';
    for (const block of searchResponse.content) {
      if (block.type === 'text') {
        const text = block.text;
        // Look for food52.com URLs in the response
        const urlMatch = text.match(/https:\/\/food52\.com\/recipes\/[^\s]+/);
        if (urlMatch) {
          recipeUrl = urlMatch[0];
          break;
        }
      }
    }

    if (!recipeUrl) {
      throw new Error('No recipe URL found in search results');
    }

    console.log(`Found recipe URL: ${recipeUrl}`);

    // Step 2: Scrape the full content from the recipe page
    const scrapedContent = await scrapeRecipeContent(recipeUrl);

    // Step 3: Use the model to format the scraped content into a clean recipe
    const formatResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `Please format the following scraped recipe content into a clean, well-structured recipe in markdown format. Include the recipe title, ingredients list, and step-by-step instructions. Remove any unnecessary text, ads, or navigation elements.

IMPORTANT FORMATTING RULES:
- Use proper markdown formatting with # for title, ## for sections
- Use bullet points (-) for ingredients, not numbered lists
- Use numbered lists (1., 2., 3.) for instructions
- Do NOT include stray bullet points or formatting artifacts
- End with a "Source:" line containing the URL

Scraped content from ${recipeUrl}:
${scrapedContent}

Please provide ONLY the formatted recipe in markdown, starting with the recipe title and ending with the source URL.`
      }]
    });

    // Extract the formatted recipe
    let recipeText = '';
    for (const block of formatResponse.content) {
      if (block.type === 'text') {
        recipeText += block.text;
      }
    }

    return c.json({ 
      recipe: recipeText,
      dish: dish,
      sourceUrl: recipeUrl
    });

  } catch (error) {
    console.error('Recipe API error:', error);
    return c.json({ error: 'Failed to fetch recipe' }, 500);
  }
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = 3000;
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});