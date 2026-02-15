import cron from 'node-cron';
import PriceWatch from '../models/PriceWatch';
import PriceHistory from '../models/PriceHistory';
import PriceAlert from '../models/PriceAlert';
import User from '../models/User';
import { sendPushNotification } from './notificationService';
import { searchProductPrice, sleep } from './priceScraperService';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

/**
 * Initialize the price check cron job
 * Runs every day at 2 AM
 */
export function initializePriceCheckCron() {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('🔍 Starting daily price check cron job...');
    await runDailyPriceCheck();
  });

  // Run hourly cleanup of expired watches
  cron.schedule('0 * * * *', async () => {
    logger.info('🧹 Running cleanup of expired price watches...');
    await cleanupExpiredWatches();
  });

  logger.info('✅ Price check cron jobs initialized');
}

/**
 * Main function to run the daily price check
 */
export async function runDailyPriceCheck() {
  const startTime = Date.now();

  try {
    // Get all active price watches that haven't expired
    const watches = await PriceWatch.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate('userId');

    logger.info(`📊 Checking prices for ${watches.length} items`);

    if (watches.length === 0) {
      logger.info('No active price watches found');
      return;
    }

    // Process in batches of 100 to avoid memory issues
    const batchSize = 100;
    let totalProcessed = 0;
    let totalAlertsSent = 0;

    for (let i = 0; i < watches.length; i += batchSize) {
      const batch = watches.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((watch) => checkPriceForWatch(watch))
      );

      // Count successful checks and alerts
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          totalProcessed++;
          if (result.value?.alertSent) {
            totalAlertsSent++;
          }
        }
      });

      // Add delay between batches to avoid rate limits
      if (i + batchSize < watches.length) {
        await sleep(5000); // 5 second delay
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    logger.info(
      `✅ Price check completed in ${duration}s. Processed: ${totalProcessed}, Alerts sent: ${totalAlertsSent}`
    );
  } catch (error) {
    logger.error('Error in daily price check:', error);
  }
}

/**
 * Check price for a single price watch item
 */
async function checkPriceForWatch(watch: any): Promise<{ alertSent: boolean } | null> {
  try {
    logger.info(`Checking price for: ${watch.itemName} (${watch.normalizedName})`);

    // Check cache first (6 hour TTL) - only if Redis is available
    const redisClient = getRedisClient();
    const cacheKey = `price:${watch.normalizedName}`;
    let cachedPrice: string | null = null;

    if (redisClient) {
      cachedPrice = await redisClient.get(cacheKey);
    }

    let priceData: any[] = [];

    if (cachedPrice) {
      logger.info(`💾 Cache hit for ${watch.itemName}`);
      priceData = JSON.parse(cachedPrice);
    } else {
      // Search for current prices
      priceData = await searchProductPrice(watch.normalizedName);

      if (!priceData || priceData.length === 0) {
        logger.info(`❌ No prices found for ${watch.itemName}`);
        watch.lastCheckedAt = new Date();
        await watch.save();
        return null;
      }

      // Save to cache (6 hours) - only if Redis is available
      if (redisClient) {
        await redisClient.setEx(cacheKey, 6 * 60 * 60, JSON.stringify(priceData));
      }
    }

    // Save all prices to price history
    for (const price of priceData) {
      await PriceHistory.create({
        priceWatchId: watch._id,
        store: price.store,
        price: price.price,
        inStock: price.inStock,
        productUrl: price.url,
        scrapedAt: new Date(),
        currency: 'USD',
      });
    }

    // Find the best (lowest) price
    const bestPrice = Math.min(...priceData.map((p) => p.price));
    const savings = watch.originalPrice - bestPrice;
    const savingsPercent = (savings / watch.originalPrice) * 100;

    logger.info(
      `Price comparison for ${watch.itemName}: Original $${watch.originalPrice}, Best $${bestPrice}, Savings: $${savings.toFixed(2)} (${savingsPercent.toFixed(1)}%)`
    );

    // Update best price found if this is better
    if (!watch.bestPriceFound || bestPrice < watch.bestPriceFound.price) {
      const bestPriceStore = priceData.find((p) => p.price === bestPrice);
      watch.bestPriceFound = {
        price: bestPrice,
        store: bestPriceStore!.store,
        date: new Date(),
        url: bestPriceStore!.url,
      };
    }

    // Update last checked time
    watch.lastCheckedAt = new Date();
    await watch.save();

    // Check if we should send an alert
    if (shouldSendAlert(watch, savings, savingsPercent)) {
      await createAndSendAlert(watch, bestPrice, savings, savingsPercent);
      return { alertSent: true };
    }

    return { alertSent: false };
  } catch (error) {
    logger.error(`Error checking price for ${watch.itemName}:`, error);
    return null;
  }
}

/**
 * Determine if an alert should be sent based on thresholds
 */
function shouldSendAlert(watch: any, savings: number, savingsPercent: number): boolean {
  const user = watch.userId;
  const thresholds = watch.thresholds;

  // Check if user has alerts enabled
  if (!user.priceAlerts?.enabled) {
    logger.info(`Alerts disabled for user ${user.email}`);
    return false;
  }

  // Check quiet hours
  if (isQuietHours(user.priceAlerts?.quietHours)) {
    logger.info(`In quiet hours for user ${user.email}, skipping alert`);
    return false;
  }

  // Check if savings meet any threshold
  if (savings <= 0) {
    return false;
  }

  // Check thresholds
  if (thresholds.anyDrop && savings > 0) {
    logger.info(`Alert triggered: Any drop threshold met (${savings.toFixed(2)})`);
    return true;
  }
  if (thresholds.percent10 && savingsPercent >= 10) {
    logger.info(`Alert triggered: 10% threshold met (${savingsPercent.toFixed(1)}%)`);
    return true;
  }
  if (thresholds.percent20 && savingsPercent >= 20) {
    logger.info(`Alert triggered: 20% threshold met (${savingsPercent.toFixed(1)}%)`);
    return true;
  }
  if (thresholds.percent30 && savingsPercent >= 30) {
    logger.info(`Alert triggered: 30% threshold met (${savingsPercent.toFixed(1)}%)`);
    return true;
  }

  return false;
}

/**
 * Check if current time is within user's quiet hours
 */
function isQuietHours(quietHours: any): boolean {
  if (!quietHours || !quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Convert to minutes

  const [startHour, startMinute] = quietHours.start.split(':').map(Number);
  const [endHour, endMinute] = quietHours.end.split(':').map(Number);

  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  // Normal quiet hours (e.g., 08:00 to 18:00)
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Create a price alert record and send push notification
 */
async function createAndSendAlert(
  watch: any,
  newPrice: number,
  savings: number,
  savingsPercent: number
): Promise<void> {
  try {
    const bestPriceStore = watch.bestPriceFound?.store || 'Unknown Store';

    // Create alert record
    const alert = await PriceAlert.create({
      userId: watch.userId._id,
      priceWatchId: watch._id,
      type: 'price_drop',
      message: `${watch.itemName} dropped to $${newPrice.toFixed(2)} at ${bestPriceStore} (${savingsPercent.toFixed(0)}% off!)`,
      originalPrice: watch.originalPrice,
      newPrice,
      savings,
      savingsPercent,
      store: bestPriceStore,
      notificationSent: false,
    });

    logger.info(`Created price alert: ${alert.message}`);

    // Send push notification
    if (watch.userId.pushNotificationToken) {
      const notificationSent = await sendPushNotification(watch.userId.pushNotificationToken, {
        title: `💰 Price Drop Alert!`,
        body: alert.message,
        data: {
          type: 'price_drop',
          priceWatchId: watch._id.toString(),
          alertId: alert._id.toString(),
        },
      });

      if (notificationSent) {
        alert.notificationSent = true;
        alert.sentAt = new Date();
        await alert.save();
        logger.info(`✅ Push notification sent for ${watch.itemName}`);
      } else {
        logger.error(`❌ Failed to send push notification for ${watch.itemName}`);
      }
    } else {
      logger.warn(`No push token for user ${watch.userId.email}, alert created but not sent`);
    }
  } catch (error) {
    logger.error('Error creating and sending alert:', error);
  }
}

/**
 * Cleanup expired price watches
 */
async function cleanupExpiredWatches(): Promise<void> {
  try {
    // Mark expired watches as inactive (don't delete, keep for history)
    const result = await PriceWatch.updateMany(
      {
        isActive: true,
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { isActive: false },
      }
    );

    logger.info(`🧹 Marked ${result.modifiedCount} expired price watches as inactive`);
  } catch (error) {
    logger.error('Error cleaning up expired watches:', error);
  }
}
