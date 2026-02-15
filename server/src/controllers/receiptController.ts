import { Response } from 'express';
import Receipt from '../models/Receipt';
import PriceWatch from '../models/PriceWatch';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { keywordMatcher } from '../utils/categorization/keywordMatcher';
import { itemNormalizer } from '../utils/itemNormalizer';
import logger from '../utils/logger';

/**
 * Create a new receipt
 */
export const createReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { storeName, storeAddress, date, items, subtotal, tax, total, ocrMethod, ocrConfidence, notes } = req.body;

    // Process items: normalize names and categorize
    const processedItems = items.map((item: any) => {
      // Normalize item name
      const normalizedName = itemNormalizer.normalize(item.name);

      // Categorize using keyword matching (Tier 1 - FREE)
      const categoryMatch = keywordMatcher.categorize(normalizedName);

      return {
        name: item.name,
        normalizedName,
        category: categoryMatch.category,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.totalPrice,
        totalPrice: item.totalPrice,
        confidence: item.confidence,
      };
    });

    // Create receipt
    const receipt = new Receipt({
      userId: user._id,
      householdId: user.householdId,
      storeName,
      storeAddress,
      date: new Date(date),
      items: processedItems,
      subtotal,
      tax,
      total,
      ocrMethod: ocrMethod || 'manual',
      ocrConfidence,
      verified: false,
      notes,
    });

    await receipt.save();

    logger.info(`Receipt created for user ${user.email}: ${receipt._id}`);

    // Auto-create price watches for all items (Phase 2 feature)
    try {
      // Get user's full document to access price alert preferences
      const fullUser = await User.findById(user._id);

      if (fullUser) {
        const priceWatches = await Promise.all(
          processedItems.map((item: any) =>
            PriceWatch.create({
              userId: user._id,
              receiptId: receipt._id,
              itemName: item.name,
              normalizedName: item.normalizedName,
              category: item.category,
              originalPrice: item.totalPrice,
              storeName,
              purchaseDate: new Date(date),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              thresholds: fullUser.priceAlerts?.thresholds || {
                anyDrop: false,
                percent10: true,
                percent20: true,
                percent30: true,
              },
              isActive: true,
            })
          )
        );

        logger.info(
          `Created ${priceWatches.length} price watches for receipt ${receipt._id}`
        );
      }
    } catch (error) {
      // Don't fail the receipt creation if price watch creation fails
      logger.error('Error creating price watches:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: {
        receipt,
      },
    });
  } catch (error: any) {
    logger.error('Create receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create receipt',
      error: error.message,
    });
  }
};

/**
 * Get all receipts for the authenticated user
 */
export const getReceipts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { startDate, endDate, store, limit = 50, skip = 0 } = req.query;

    // Build query
    const query: any = { userId: user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (store) {
      query.storeName = new RegExp(store as string, 'i');
    }

    // Fetch receipts
    const receipts = await Receipt.find(query)
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await Receipt.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        receipts,
        pagination: {
          total,
          limit: Number(limit),
          skip: Number(skip),
          hasMore: total > Number(skip) + Number(limit),
        },
      },
    });
  } catch (error: any) {
    logger.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get receipts',
      error: error.message,
    });
  }
};

/**
 * Get a single receipt by ID
 */
export const getReceiptById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const receipt = await Receipt.findOne({ _id: id, userId: user._id });

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        receipt,
      },
    });
  } catch (error: any) {
    logger.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get receipt',
      error: error.message,
    });
  }
};

/**
 * Update a receipt
 */
export const updateReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const receipt = await Receipt.findOne({ _id: id, userId: user._id });

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
      return;
    }

    const { storeName, storeAddress, date, items, subtotal, tax, total, verified, notes } = req.body;

    if (storeName) receipt.storeName = storeName;
    if (storeAddress) receipt.storeAddress = storeAddress;
    if (date) receipt.date = new Date(date);
    if (subtotal !== undefined) receipt.subtotal = subtotal;
    if (tax !== undefined) receipt.tax = tax;
    if (total !== undefined) receipt.total = total;
    if (verified !== undefined) receipt.verified = verified;
    if (notes !== undefined) receipt.notes = notes;

    if (items) {
      // Reprocess items if updated
      const processedItems = items.map((item: any) => {
        const normalizedName = itemNormalizer.normalize(item.name);
        const categoryMatch = keywordMatcher.categorize(normalizedName);

        return {
          name: item.name,
          normalizedName,
          category: item.category || categoryMatch.category,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.totalPrice,
          totalPrice: item.totalPrice,
          confidence: item.confidence,
        };
      });

      receipt.items = processedItems;
    }

    await receipt.save();

    logger.info(`Receipt updated: ${receipt._id}`);

    res.status(200).json({
      success: true,
      message: 'Receipt updated successfully',
      data: {
        receipt,
      },
    });
  } catch (error: any) {
    logger.error('Update receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update receipt',
      error: error.message,
    });
  }
};

/**
 * Delete a receipt
 */
export const deleteReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const receipt = await Receipt.findOneAndDelete({ _id: id, userId: user._id });

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
      return;
    }

    logger.info(`Receipt deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Receipt deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete receipt',
      error: error.message,
    });
  }
};
