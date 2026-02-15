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

### Limitations:
- May not always find products
- CSS selectors may need updating if Costco updates their site
- Lower success rate compared to Best Buy API

## How Price Tracking Works

When a user enables price tracking for an item:

1. **Daily Cron Job** runs at 2 AM (configured in `server/src/services/priceCheckCronService.ts`)

2. **Price Search** queries multiple sources:
   - Walmart (web scraping)
   - Target (web scraping)
   - **Best Buy (API)** ← New!
   - **Costco (web scraping)** ← New!
   - Open Food Facts (API)

3. **Best Price** is automatically saved and user is notified

4. **Rate Limiting** prevents excessive requests:
   - Walmart: Unlimited (for now)
   - Target: 50/day
   - Best Buy: 50/day
   - Costco: 30/day

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

## Troubleshooting

### Best Buy API Not Working:
1. Check if API key is set: `echo $BESTBUY_API_KEY`
2. Verify API key is valid at https://developer.bestbuy.com/
3. Check server logs for error messages
4. Ensure you haven't exceeded rate limits

### Costco Scraping Not Working:
1. Check if Costco changed their website structure
2. Update CSS selectors in `priceScraperService.ts`
3. Try accessing https://www.costco.com directly to verify it's accessible
4. Check rate limiting (30 requests per day)

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
