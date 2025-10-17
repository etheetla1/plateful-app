import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrape recipe content from a URL
 */
export async function scrapeRecipeContent(url: string): Promise<string> {
  try {
    console.log(`Scraping content from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, .advertisement, .ads, .ad, .sidebar, .comments, .social-share, .related, .newsletter, noscript').remove();
    
    let content = '';
    
    // Strategy 1: Look for structured recipe markup (JSON-LD)
    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const json = JSON.parse($(scripts[i]).html() || '{}');
        if (json['@type'] === 'Recipe' || json['@type']?.includes?.('Recipe')) {
          content = JSON.stringify(json, null, 2);
          console.log(`Found structured recipe markup`);
          break;
        }
      } catch (e) {
        // Not JSON-LD, continue
      }
    }
    
    // Strategy 2: Try to find recipe-specific content using common selectors
    if (!content || content.length < 200) {
      const recipeSelectors = [
        '[itemtype*="Recipe"]',
        '.recipe',
        '.recipe-content',
        '.recipe-body',
        '.recipe-instructions',
        '.recipe-ingredients',
        '.recipe-details',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.content-wrapper',
        'article[class*="recipe"]',
        'main[class*="recipe"]',
        'article',
        'main',
      ];
      
      for (const selector of recipeSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.text().trim();
          if (text.length > 300) {
            content = text;
            console.log(`Found recipe content using selector: ${selector}`);
            break;
          }
        }
      }
    }
    
    // Strategy 3: Fallback to body content if no specific recipe content found
    if (!content || content.length < 200) {
      content = $('body').text().trim();
      console.log(`Using full body content as fallback`);
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    console.log(`✅ Scraped ${content.length} characters from ${url}`);
    
    if (content.length < 100) {
      throw new Error('Scraped content is too short, likely failed to extract recipe');
    }
    
    return content;
    
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error instanceof Error ? error.message : error);
    throw new Error(`Failed to scrape content from ${url}`);
  }
}

