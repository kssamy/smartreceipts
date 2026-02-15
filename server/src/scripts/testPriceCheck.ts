import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { connectRedis } from '../config/redis';
import { runDailyPriceCheck } from '../services/priceCheckService';
import logger from '../utils/logger';

// Import all models to register schemas
import '../models/User';
import '../models/PriceWatch';
import '../models/PriceHistory';
import '../models/PriceAlert';

// Load environment variables
dotenv.config();

/**
 * Manual script to test the daily price check
 * Run with: npx ts-node src/scripts/testPriceCheck.ts
 */
async function testPriceCheck() {
  try {
    logger.info('🧪 Manual Price Check Test Starting...');
    logger.info('='.repeat(50));

    // Connect to database
    logger.info('📦 Connecting to MongoDB...');
    await connectDatabase();
    logger.info('✅ MongoDB connected');

    // Connect to Redis (optional)
    try {
      logger.info('📦 Connecting to Redis...');
      await connectRedis();
      logger.info('✅ Redis connected');
    } catch (error) {
      logger.warn('⚠️  Redis connection failed - continuing without cache');
    }

    // Run the price check
    logger.info('🔍 Starting price check...');
    await runDailyPriceCheck();
    logger.info('='.repeat(50));
    logger.info('✅ Manual price check test completed!');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error running price check test:', error);
    process.exit(1);
  }
}

// Run the test
testPriceCheck();
