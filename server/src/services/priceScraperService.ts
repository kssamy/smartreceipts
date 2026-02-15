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
  const targetRequestCount = await getRequestCountToday('target');
  if (targetRequestCount < 50) {
    try {
      const targetPrice = await scrapeTarget(normalizedName);
      if (targetPrice) results.push(targetPrice);
      await incrementRequestCount('target');
    } catch (error) {
      logger.error('Target scraping error:', error);
    }
  }

  // Strategy 4: Best Buy API (if API key is configured)
  const bestbuyRequestCount = await getRequestCountToday('bestbuy');
  if (bestbuyRequestCount < 50 && process.env.BESTBUY_API_KEY) {
    try {
      const bestBuyPrice = await searchBestBuy(normalizedName);
      if (bestBuyPrice) results.push(bestBuyPrice);
      await incrementRequestCount('bestbuy');
    } catch (error) {
      logger.error('Best Buy API error:', error);
    }
  }

  // Strategy 5: Scrape Costco (if request count < daily limit)
  const costcoRequestCount = await getRequestCountToday('costco');
  if (costcoRequestCount < 30) {
    try {
      const costcoPrice = await scrapeCostco(normalizedName);
      if (costcoPrice) results.push(costcoPrice);
      await incrementRequestCount('costco');
    } catch (error) {
      logger.error('Costco scraping error:', error);
    }
  }

  // Strategy 6: Scrape Safeway (if request count < daily limit)
  const safewayRequestCount = await getRequestCountToday('safeway');
  if (safewayRequestCount < 50) {
    try {
      const safewayPrice = await scrapeSafeway(normalizedName);
      if (safewayPrice) results.push(safewayPrice);
      await incrementRequestCount('safeway');
    } catch (error) {
      logger.error('Safeway scraping error:', error);
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
    if (!redisClient) {
      return 0; // No rate limiting without Redis
    }
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
    if (!redisClient) {
      return; // No rate limiting without Redis
    }
    const key = `scrape_count:${store}:${new Date().toISOString().split('T')[0]}`;
    await redisClient.incr(key);
    await redisClient.expire(key, 24 * 60 * 60); // Expire after 24 hours
  } catch (error) {
    logger.error(`Error incrementing request count for ${store}:`, error);
  }
}

/**
 * Search Best Buy API for product prices
 * Requires BESTBUY_API_KEY environment variable
 * Get free API key at: https://developer.bestbuy.com/
 */
async function searchBestBuy(query: string): Promise<PriceResult | null> {
  try {
    const apiKey = process.env.BESTBUY_API_KEY;
    if (!apiKey) {
      logger.warn('Best Buy API key not configured');
      return null;
    }

    // Best Buy Products API
    const url = `https://api.bestbuy.com/v1/products((search=${encodeURIComponent(query)}))?apiKey=${apiKey}&sort=salePrice.asc&show=sku,name,salePrice,url,onlineAvailability&pageSize=1&format=json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SmartReceipt/1.0',
      },
    });

    if (!response.ok) {
      logger.warn(`Best Buy API returned ${response.status} for query: ${query}`);
      return null;
    }

    const data: any = await response.json();

    if (data.products && data.products.length > 0) {
      const product = data.products[0];

      if (product.salePrice) {
        logger.info(`Found Best Buy price for "${query}": $${product.salePrice}`);

        return {
          store: 'Best Buy',
          price: product.salePrice,
          inStock: product.onlineAvailability === true,
          url: product.url || `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(query)}`,
        };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error searching Best Buy API:', error);
    return null;
  }
}

/**
 * Scrape Costco.com for product prices
 * Note: Costco requires membership to view prices, so this may have limited success
 */
async function scrapeCostco(query: string): Promise<PriceResult | null> {
  try {
    const searchUrl = `https://www.costco.com/CatalogSearch?keyword=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
        Referer: 'https://www.costco.com/',
      },
    });

    if (!response.ok) {
      logger.warn(`Costco returned ${response.status} for query: ${query}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Costco's product structure (selectors may need updating)
    const firstProduct = $('.product').first();

    if (firstProduct.length === 0) {
      logger.info(`No Costco products found for: ${query}`);
      return null;
    }

    // Try multiple price selector patterns
    let priceText = firstProduct.find('.price').first().text();
    if (!priceText) {
      priceText = firstProduct.find('[automation-id="productPriceOutput"]').text();
    }
    if (!priceText) {
      priceText = firstProduct.find('.op-value').text();
    }

    const productLink = firstProduct.find('a').first().attr('href');

    if (priceText) {
      // Extract numeric price from text like "$4.99" or "$4 99"
      const priceMatch = priceText.match(/\$?\s*(\d+)[\s.]?(\d{2})/);
      if (priceMatch) {
        const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);

        logger.info(`Found Costco price for "${query}": $${price}`);

        return {
          store: 'Costco',
          price,
          inStock: true,
          url: productLink ? `https://www.costco.com${productLink}` : searchUrl,
        };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error scraping Costco:', error);
    return null;
  }
}

/**
 * Scrape Safeway.com for product prices
 * Note: Safeway (Albertsons) uses club card pricing, so prices may vary
 */
async function scrapeSafeway(query: string): Promise<PriceResult | null> {
  try {
    const searchUrl = `https://www.safeway.com/shop/search-results.html?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      logger.warn(`Safeway returned ${response.status} for query: ${query}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Safeway's product structure (selectors may need updating)
    // Try multiple selector patterns
    let firstProduct = $('.product-item').first();
    if (firstProduct.length === 0) {
      firstProduct = $('[data-testid="product-card"]').first();
    }
    if (firstProduct.length === 0) {
      firstProduct = $('.product-tile').first();
    }

    if (firstProduct.length === 0) {
      logger.info(`No Safeway products found for: ${query}`);
      return null;
    }

    // Try multiple price selector patterns
    let priceText = firstProduct.find('.product-price').first().text();
    if (!priceText) {
      priceText = firstProduct.find('[data-testid="product-price"]').text();
    }
    if (!priceText) {
      priceText = firstProduct.find('.price').text();
    }
    if (!priceText) {
      priceText = firstProduct.find('.price-regular').text();
    }

    // Get product link
    const productLink = firstProduct.find('a').first().attr('href');

    if (priceText) {
      // Extract numeric price from text like "$4.99" or "4.99"
      const priceMatch = priceText.match(/\$?\s*(\d+)\.(\d{2})/);
      if (priceMatch) {
        const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);

        logger.info(`Found Safeway price for "${query}": $${price}`);

        return {
          store: 'Safeway',
          price,
          inStock: true,
          url: productLink
            ? productLink.startsWith('http')
              ? productLink
              : `https://www.safeway.com${productLink}`
            : searchUrl,
        };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error scraping Safeway:', error);
    return null;
  }
}

/**
 * Add a delay between requests to avoid rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
