# Retail API Integration Setup

This document explains how to integrate with Costco and Best Buy for price comparison.

## Best Buy API (Official API - Recommended)

### Setup Steps:

1. **Register for Best Buy Developer Account**
   - Visit: https://developer.bestbuy.com/
   - Click "Get API Key"
   - Fill out the registration form
   - You'll receive your API key immediately (it's free!)

2. **Add API Key to Environment**
   ```bash
   # In your server/.env file
   BESTBUY_API_KEY=your_api_key_here
   ```

3. **Rate Limits**
   - Free tier: 50,000 queries per day
   - The app automatically limits to 50 requests per day per store
   - More than enough for typical usage

### Features:
- Real-time pricing
- Stock availability
- Product URLs for direct links
- Official API (won't break)
- High quality data

## Costco Integration (Web Scraping)

### How It Works:
- Scrapes Costco.com search results
- Extracts prices from product listings
- Limited to 30 requests per day to avoid rate limiting

### Important Notes:
- **No Official API**: Costco doesn't provide a public API
- **Web Scraping**: May break if Costco changes their website structure
- **Membership Required**: Some prices may require Costco membership to view
- **Legal Considerations**: Web scraping is a gray area - use responsibly
- ⚠️ **Currently Blocked**: Returns 403 Forbidden due to Cloudflare protection

### Limitations:
- May not always find products
- CSS selectors may need updating if Costco updates their site
- Lower success rate compared to Best Buy API

## Safeway Integration (Web Scraping)

### How It Works:
- Scrapes Safeway.com (Albertsons Companies) search results
- Extracts prices from product listings
- Limited to 50 requests per day to avoid rate limiting
- Multiple CSS selector fallback patterns for reliability

### Important Notes:
- **No Official API**: Safeway doesn't provide a public API
- **Web Scraping**: May break if Safeway changes their website structure
- **Club Card Pricing**: Prices may vary based on club card membership
- **Legal Considerations**: Web scraping is a gray area - use responsibly
- ⚠️ **Currently Blocked**: Anti-bot protection may block requests

### CSS Selectors Used:
- Product cards: `.product-item`, `[data-testid="product-card"]`, `.product-tile`
- Prices: `.product-price`, `[data-testid="product-price"]`, `.price`, `.price-regular`
- Uses multiple fallback patterns to handle site updates

### Limitations:
- May not always find products
- CSS selectors may need updating if Safeway updates their site
- Lower success rate compared to Best Buy API
- Anti-bot detection may require proxy services

## How Price Tracking Works

When a user enables price tracking for an item:

1. **Daily Cron Job** runs at 2 AM (configured in `server/src/services/priceCheckCronService.ts`)

2. **Price Search** queries multiple sources:
   - Walmart (web scraping) ⚠️ Currently blocked by anti-bot
   - Target (web scraping) ⚠️ Currently blocked by anti-bot
   - **Best Buy (API)** ✅ Official API - Recommended!
   - **Costco (web scraping)** ⚠️ Blocked by Cloudflare (403)
   - **Safeway (web scraping)** ⚠️ Currently blocked by anti-bot
   - Open Food Facts (API) ℹ️ No price data

3. **Best Price** is automatically saved and user is notified

4. **Rate Limiting** prevents excessive requests:
   - Walmart: Unlimited (currently blocked)
   - Target: 50/day (currently blocked)
   - Best Buy: 50/day ✅ Working
   - Costco: 30/day (blocked by Cloudflare)
   - Safeway: 50/day (currently blocked)

## Testing

### Test Best Buy Integration:
```bash
# From server directory
npm run test-price-check

# Or run the test script directly
ts-node src/scripts/testPriceCheck.ts
```

### Manual Test:
```bash
curl http://localhost:3000/api/v1/price-watch
```

Check the logs for price scraping results.

## Current Status: Web Scraping Challenges

**⚠️ IMPORTANT**: As of February 2026, all major retailers (Walmart, Target, Costco, Safeway) have implemented sophisticated anti-bot protection that blocks direct web scraping attempts. When testing, you'll see "Robot or human?" challenge pages instead of actual product listings.

### Why Web Scraping Is Currently Blocked:

1. **Anti-Bot Detection**: Retailers use services like Cloudflare, PerimeterX, or DataDome to detect and block automated requests
2. **Challenge Pages**: Instead of product pages, scrapers receive CAPTCHA or verification pages
3. **Dynamic Content**: Many retailers load prices via JavaScript, which simple HTTP requests can't execute

### Recommended Approach: Use Best Buy API

✅ **Best Buy API is the only reliable option** because:
- Official API with guaranteed uptime
- No anti-bot protection
- Real-time pricing and stock data
- Free tier: 50,000 queries/day
- Easy to set up (just register for API key)

### Alternative Solutions for Web Scraping (Future):

If you need to scrape other retailers, consider these approaches:

1. **Browser Automation** (Puppeteer/Playwright)
   - Runs a real browser to bypass anti-bot detection
   - More resource-intensive
   - Higher success rate

2. **Proxy Services** (ScraperAPI, Bright Data)
   - Paid services that handle anti-bot challenges
   - ~$50-200/month
   - Rotating residential IPs

3. **Third-Party APIs** (Rainforest API, Oxylabs)
   - Aggregate product data from multiple retailers
   - ~$50-500/month depending on usage
   - No scraping needed

4. **Rate Limiting & Headers**
   - Slow down requests to appear more human-like
   - Rotate user agents
   - Limited success with modern anti-bot systems

## Troubleshooting

### Best Buy API Not Working:
1. Check if API key is set: `echo $BESTBUY_API_KEY`
2. Verify API key is valid at https://developer.bestbuy.com/
3. Check server logs for error messages
4. Ensure you haven't exceeded rate limits

### Web Scraping Returns "Robot or human?" or 403:
1. ✅ **Expected behavior** - Anti-bot protection is working
2. Consider using Best Buy API instead
3. For production, evaluate paid proxy/scraping services
4. Browser automation (Puppeteer) may work but increases costs

## Future Enhancements

Potential improvements for Phase 3+:

1. **Amazon API**: Requires Amazon Associates approval
2. **Google Shopping API**: Provides aggregated prices from multiple retailers
3. **Rainforest API**: Third-party service for Amazon/Walmart/etc. (paid)
4. **Kroger API**: For grocery items
5. **Instacart API**: For fresh groceries

## Cost Considerations

- **Best Buy API**: FREE (50k queries/day)
- **Costco Scraping**: FREE (but limited)
- **Current implementation**: $0/month

Alternative paid services if needed:
- Rainforest API: ~$50/month for 2000 requests
- Google Shopping API: Pay per click
- ScraperAPI: ~$50/month for proxy + scraping
