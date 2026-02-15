import * as cheerio from 'cheerio';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

export interface PriceResult {
  store: string;
  price: number;
  inStock: boolean;
  url: string;
}

/**
 * Main function to search for product prices across multiple sources
 */
export async function searchProductPrice(normalizedName: string): Promise<PriceResult[]> {
  const results: PriceResult[] = [];

  // Strategy 1: Try Open Food Facts API (free, unlimited)
  try {
    const offPrice = await searchOpenFoodFacts(normalizedName);
    if (offPrice) results.push(offPrice);
  } catch (error) {
    logger.error('Open Food Facts error:', error);
  }

  // Strategy 2: Scrape Walmart
  try {
    const walmartPrice = await scrapeWalmart(normalizedName);
    if (walmartPrice) results.push(walmartPrice);
  } catch (error) {
    logger.error('Walmart scraping error:', error);
  }

  // Strategy 3: Scrape Target (if request count < daily limit)
  const requestCount = await getRequestCountToday('target');
  if (requestCount < 50) {
    try {
      const targetPrice = await scrapeTarget(normalizedName);
      if (targetPrice) results.push(targetPrice);
      await incrementRequestCount('target');
    } catch (error) {
      logger.error('Target scraping error:', error);
    }
  }

  return results;
}

/**
 * Search Open Food Facts API for product prices
 * https://world.openfoodfacts.org/api
 */
async function searchOpenFoodFacts(query: string): Promise<PriceResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SmartReceipt/1.0 (Price comparison for consumers)',
      },
    });

    if (!response.ok) {
      logger.warn(`Open Food Facts API returned ${response.status}`);
      return null;
    }

    const data: any = await response.json();

    if (data.products && data.products.length > 0) {
      const product = data.products[0];

      // Open Food Facts doesn't always have prices, but we can try to extract from product data
      // For now, we'll return a placeholder since OFF focuses on nutrition data
      // In production, you might want to use the barcode to search actual store prices

      logger.info(`Found product in Open Food Facts: ${product.product_name || 'Unknown'}`);

      // Since OFF doesn't have real-time prices, return null
      // This can be enhanced to use the UPC/barcode for searching other price sources
      return null;
    }

    return null;
  } catch (error) {
    logger.error('Error searching Open Food Facts:', error);
    return null;
  }
}

/**
 * Scrape Walmart.com for product prices
 */
async function scrapeWalmart(query: string): Promise<PriceResult | null> {
  try {
    const searchUrl = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      logger.warn(`Walmart returned ${response.status} for query: ${query}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Walmart's structure (these selectors may need updating as their site changes)
    const firstProduct = $('[data-item-id]').first();

    if (firstProduct.length === 0) {
      logger.info(`No Walmart products found for: ${query}`);
      return null;
    }

    const priceText = firstProduct.find('[data-automation-id="product-price"]').text();
    const productLink = firstProduct.find('a[link-identifier]').attr('href');

    if (priceText) {
      // Extract numeric price from text like "$4.99" or "Now $4.99"
      const priceMatch = priceText.match(/\$?(\d+\.\d{2})/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);

        logger.info(`Found Walmart price for "${query}": $${price}`);

        return {
          store: 'Walmart',
          price,
          inStock: true,
          url: productLink ? `https://www.walmart.com${productLink}` : searchUrl,
        };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error scraping Walmart:', error);
    return null;
  }
}

/**
 * Scrape Target.com for product prices
 */
async function scrapeTarget(query: string): Promise<PriceResult | null> {
  try {
    const searchUrl = `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      logger.warn(`Target returned ${response.status} for query: ${query}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Target's structure (these selectors may need updating)
    // Target often loads content dynamically, so this might not work well
    const priceElement = $('[data-test="product-price"]').first();

    if (priceElement.length === 0) {
      logger.info(`No Target products found for: ${query}`);
      return null;
    }

    const priceText = priceElement.text();
    const priceMatch = priceText.match(/\$?(\d+\.\d{2})/);

    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);

      logger.info(`Found Target price for "${query}": $${price}`);

      return {
        store: 'Target',
        price,
        inStock: true,
        url: searchUrl,
      };
    }

    return null;
  } catch (error) {
    logger.error('Error scraping Target:', error);
    return null;
  }
}

/**
 * Get the number of requests made to a specific store today
 */
async function getRequestCountToday(store: string): Promise<number> {
  try {
    const redisClient = getRedisClient();
    const key = `scrape_count:${store}:${new Date().toISOString().split('T')[0]}`;
    const count = await redisClient.get(key);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    logger.error(`Error getting request count for ${store}:`, error);
    return 0;
  }
}

/**
 * Increment the request count for a specific store today
 */
async function incrementRequestCount(store: string): Promise<void> {
  try {
    const redisClient = getRedisClient();
    const key = `scrape_count:${store}:${new Date().toISOString().split('T')[0]}`;
    await redisClient.incr(key);
    await redisClient.expire(key, 24 * 60 * 60); // Expire after 24 hours
  } catch (error) {
    logger.error(`Error incrementing request count for ${store}:`, error);
  }
}

/**
 * Add a delay between requests to avoid rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
