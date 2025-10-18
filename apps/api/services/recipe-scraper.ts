import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrape recipe content from a URL
 */
export async function scrapeRecipeContent(url: string): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Scraping content from: ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });
      
      if (response.status === 403) {
        throw new Error(`Access forbidden (403) - website blocking scraper`);
      }
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    
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
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Error scraping ${url} (attempt ${attempt}/${maxRetries}):`, lastError.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all retries failed
  console.error(`❌ Failed to scrape ${url} after ${maxRetries} attempts`);
  throw new Error(`Failed to scrape content from ${url} after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

