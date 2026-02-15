/**
 * Quick test script for Costco price scraping
 * Run: npx ts-node src/scripts/testCostcoPrice.ts
 */

import { searchProductPrice } from '../services/priceScraperService';
import logger from '../utils/logger';

async function testCostcoPricing() {
  console.log('\n=== Testing Costco Price Scraping ===\n');

  // Test products - common items at Costco
  const testProducts = [
    'organic milk',
    'kirkland olive oil',
    'eggs',
    'rotisserie chicken',
    'paper towels',
  ];

  for (const product of testProducts) {
    console.log(`\n🔍 Searching for: "${product}"`);
    console.log('─'.repeat(50));

    try {
      const results = await searchProductPrice(product);

      if (results.length === 0) {
        console.log('❌ No prices found from any retailer');
      } else {
        console.log(`✅ Found ${results.length} price(s):\n`);

        // Sort by price (lowest first)
        results.sort((a, b) => a.price - b.price);

        results.forEach((result, index) => {
          const icon = result.store === 'Costco' ? '🛒' : '🏬';
          console.log(`${icon} ${index + 1}. ${result.store}`);
          console.log(`   Price: $${result.price.toFixed(2)}`);
          console.log(`   In Stock: ${result.inStock ? 'Yes' : 'No'}`);
          console.log(`   URL: ${result.url}`);
          console.log('');
        });

        // Highlight Costco specifically
        const costcoResult = results.find((r) => r.store === 'Costco');
        if (costcoResult) {
          console.log('🎯 Costco price found successfully!');
          console.log(`   $${costcoResult.price.toFixed(2)}`);
        } else {
          console.log('⚠️  No Costco price found (may need membership or product not available)');
        }
      }

      // Wait between searches to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error searching for "${product}":`, error);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Testing complete!');
  console.log('='.repeat(50) + '\n');

  // Exit
  process.exit(0);
}

// Run the test
testCostcoPricing().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
