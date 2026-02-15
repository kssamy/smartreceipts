/**
 * Test which retailers are currently working
 * Run: npx ts-node src/scripts/testAllRetailers.ts
 */

import { searchProductPrice } from '../services/priceScraperService';

async function testRetailers() {
  console.log('\n🧪 Testing Price Scraping for All Retailers\n');
  console.log('='.repeat(60));

  const testProduct = 'milk'; // Simple product most retailers have

  console.log(`\n📦 Test Product: "${testProduct}"\n`);

  const results = await searchProductPrice(testProduct);

  console.log('\n📊 Results:\n');

  if (results.length === 0) {
    console.log('❌ No prices found from any retailer');
    console.log('\nPossible reasons:');
    console.log('- Anti-bot protection blocking requests');
    console.log('- Product not found at any retailer');
    console.log('- Network/connection issues');
  } else {
    // Group by retailer
    const retailers = ['Walmart', 'Target', 'Best Buy', 'Costco', 'Safeway', 'Open Food Facts'];

    retailers.forEach((retailer) => {
      const result = results.find((r) => r.store === retailer);

      if (result) {
        console.log(`✅ ${retailer.padEnd(20)} $${result.price.toFixed(2)}`);
      } else {
        console.log(`❌ ${retailer.padEnd(20)} Not found`);
      }
    });

    console.log('\n' + '─'.repeat(60));
    console.log(`\n✅ Successfully found prices from ${results.length} retailer(s)`);

    // Show best price
    const bestPrice = Math.min(...results.map((r) => r.price));
    const bestStore = results.find((r) => r.price === bestPrice)?.store;
    console.log(`🎯 Best Price: $${bestPrice.toFixed(2)} at ${bestStore}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Tips:');
  console.log('- Best Buy requires API key (BESTBUY_API_KEY in .env)');
  console.log('- Costco may be blocked by anti-bot protection');
  console.log('- Walmart & Target scraping usually works');
  console.log('\n');

  process.exit(0);
}

testRetailers().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
