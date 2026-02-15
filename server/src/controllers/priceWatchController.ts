import { Request, Response } from 'express';
import PriceWatch from '../models/PriceWatch';
import PriceHistory from '../models/PriceHistory';
import PriceAlert from '../models/PriceAlert';
import logger from '../utils/logger';

/**
 * Get all price watches for the authenticated user
 */
export async function getPriceWatches(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;

    const watches = await PriceWatch.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: watches,
      count: watches.length,
    });
  } catch (error) {
    logger.error('Error fetching price watches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price watches',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get price history for a specific price watch
 */
export async function getPriceHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { watchId } = req.params;

    // Verify the watch belongs to the user
    const watch = await PriceWatch.findOne({
      _id: watchId,
      userId,
    });

    if (!watch) {
      res.status(404).json({
        success: false,
        message: 'Price watch not found',
      });
      return;
    }

    // Get price history
    const history = await PriceHistory.find({
      priceWatchId: watchId,
    })
      .sort({ scrapedAt: -1 })
      .limit(30) // Last 30 price checks
      .lean();

    res.json({
      success: true,
      data: {
        watch,
        history,
      },
    });
  } catch (error) {
    logger.error('Error fetching price history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Create a new price watch manually
 */
export async function createPriceWatch(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const user = (req as any).user;
    const { itemName, normalizedName, category, originalPrice, storeName, purchaseDate } = req.body;

    // Validate required fields
    if (!itemName || !originalPrice || !storeName) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: itemName, originalPrice, storeName',
      });
      return;
    }

    // Create price watch
    const priceWatch = await PriceWatch.create({
      userId,
      receiptId: null, // Manual creation, no receipt associated
      itemName,
      normalizedName: normalizedName || itemName.toLowerCase().replace(/\s+/g, ' ').trim(),
      category: category || 'Other',
      originalPrice,
      storeName,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      thresholds: user.priceAlerts?.thresholds || {
        anyDrop: false,
        percent10: true,
        percent20: true,
        percent30: true,
      },
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: priceWatch,
      message: 'Price watch created successfully',
    });
  } catch (error) {
    logger.error('Error creating price watch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create price watch',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Update alert thresholds for a price watch
 */
export async function updateThresholds(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { watchId } = req.params;
    const { thresholds } = req.body;

    if (!thresholds) {
      res.status(400).json({
        success: false,
        message: 'Missing thresholds in request body',
      });
      return;
    }

    // Verify the watch belongs to the user
    const watch = await PriceWatch.findOne({
      _id: watchId,
      userId,
    });

    if (!watch) {
      res.status(404).json({
        success: false,
        message: 'Price watch not found',
      });
      return;
    }

    // Update thresholds
    watch.thresholds = {
      anyDrop: thresholds.anyDrop !== undefined ? thresholds.anyDrop : watch.thresholds.anyDrop,
      percent10:
        thresholds.percent10 !== undefined ? thresholds.percent10 : watch.thresholds.percent10,
      percent20:
        thresholds.percent20 !== undefined ? thresholds.percent20 : watch.thresholds.percent20,
      percent30:
        thresholds.percent30 !== undefined ? thresholds.percent30 : watch.thresholds.percent30,
    };

    await watch.save();

    res.json({
      success: true,
      data: watch,
      message: 'Thresholds updated successfully',
    });
  } catch (error) {
    logger.error('Error updating thresholds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Delete (deactivate) a price watch
 */
export async function deletePriceWatch(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { watchId } = req.params;

    // Verify the watch belongs to the user
    const watch = await PriceWatch.findOne({
      _id: watchId,
      userId,
    });

    if (!watch) {
      res.status(404).json({
        success: false,
        message: 'Price watch not found',
      });
      return;
    }

    // Deactivate instead of deleting (keep history)
    watch.isActive = false;
    await watch.save();

    res.json({
      success: true,
      message: 'Price watch deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting price watch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete price watch',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get price alerts for the authenticated user
 */
export async function getPriceAlerts(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;

    const alerts = await PriceAlert.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('priceWatchId')
      .lean();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    logger.error('Error fetching price alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price alerts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get savings summary (money left on the table)
 */
export async function getSavingsSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;

    // Get all watches with best prices found
    const watches = await PriceWatch.find({
      userId,
      bestPriceFound: { $exists: true },
    }).lean();

    let totalSavings = 0;
    const missedOpportunities = [];

    for (const watch of watches) {
      if (watch.bestPriceFound) {
        const savings = watch.originalPrice - watch.bestPriceFound.price;

        if (savings > 0) {
          totalSavings += savings;
          missedOpportunities.push({
            itemName: watch.itemName,
            savings,
            savingsPercent: (savings / watch.originalPrice) * 100,
            bestPrice: watch.bestPriceFound.price,
            store: watch.bestPriceFound.store,
            originalPrice: watch.originalPrice,
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalSavings: parseFloat(totalSavings.toFixed(2)),
        opportunitiesCount: missedOpportunities.length,
        opportunities: missedOpportunities.sort((a, b) => b.savings - a.savings),
      },
    });
  } catch (error) {
    logger.error('Error fetching savings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
