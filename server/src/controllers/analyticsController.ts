import { Response } from 'express';
import Receipt from '../models/Receipt';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

/**
 * Get spending summary by category
 */
export const getSpendingByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          userId: user._id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          totalSpent: { $sum: '$items.totalPrice' },
          itemCount: { $sum: 1 },
          avgPrice: { $avg: '$items.totalPrice' },
        },
      },
      { $sort: { totalSpent: -1 } },
    ];

    const results = await Receipt.aggregate(pipeline);

    // Calculate total for percentages
    const total = results.reduce((sum, cat) => sum + cat.totalSpent, 0);

    const categoryBreakdown = results.map((cat) => ({
      category: cat._id,
      totalSpent: Math.round(cat.totalSpent * 100) / 100,
      itemCount: cat.itemCount,
      avgPrice: Math.round(cat.avgPrice * 100) / 100,
      percentage: Math.round((cat.totalSpent / total) * 100 * 10) / 10,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalSpent: Math.round(total * 100) / 100,
        categories: categoryBreakdown,
      },
    });
  } catch (error: any) {
    logger.error('Get spending by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get spending breakdown',
      error: error.message,
    });
  }
};

/**
 * Get spending trends over time
 */
export const getSpendingTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Determine grouping format
    let dateFormat: any;
    switch (groupBy) {
      case 'day':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$date' } };
        break;
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    }

    // Aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          userId: user._id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
      },
      {
        $group: {
          _id: dateFormat,
          totalSpent: { $sum: '$total' },
          receiptCount: { $sum: 1 },
          avgReceiptAmount: { $avg: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await Receipt.aggregate(pipeline);

    const trends = results.map((item) => ({
      period: item._id,
      totalSpent: Math.round(item.totalSpent * 100) / 100,
      receiptCount: item.receiptCount,
      avgReceiptAmount: Math.round(item.avgReceiptAmount * 100) / 100,
    }));

    res.status(200).json({
      success: true,
      data: {
        trends,
      },
    });
  } catch (error: any) {
    logger.error('Get spending trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get spending trends',
      error: error.message,
    });
  }
};

/**
 * Get top purchased items
 */
export const getTopItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { startDate, endDate, limit = 10 } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          userId: user._id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.normalizedName',
          category: { $first: '$items.category' },
          totalSpent: { $sum: '$items.totalPrice' },
          totalQuantity: { $sum: '$items.quantity' },
          purchaseCount: { $sum: 1 },
          avgPrice: { $avg: '$items.totalPrice' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: Number(limit) },
    ];

    const results = await Receipt.aggregate(pipeline);

    const topItems = results.map((item) => ({
      itemName: item._id,
      category: item.category,
      totalSpent: Math.round(item.totalSpent * 100) / 100,
      totalQuantity: item.totalQuantity,
      purchaseCount: item.purchaseCount,
      avgPrice: Math.round(item.avgPrice * 100) / 100,
    }));

    res.status(200).json({
      success: true,
      data: {
        topItems,
      },
    });
  } catch (error: any) {
    logger.error('Get top items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top items',
      error: error.message,
    });
  }
};

/**
 * Get spending by store
 */
export const getSpendingByStore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          userId: user._id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
      },
      {
        $group: {
          _id: '$storeName',
          totalSpent: { $sum: '$total' },
          visitCount: { $sum: 1 },
          avgBasketSize: { $avg: '$total' },
        },
      },
      { $sort: { totalSpent: -1 } },
    ];

    const results = await Receipt.aggregate(pipeline);

    const storeBreakdown = results.map((store) => ({
      storeName: store._id,
      totalSpent: Math.round(store.totalSpent * 100) / 100,
      visitCount: store.visitCount,
      avgBasketSize: Math.round(store.avgBasketSize * 100) / 100,
    }));

    res.status(200).json({
      success: true,
      data: {
        stores: storeBreakdown,
      },
    });
  } catch (error: any) {
    logger.error('Get spending by store error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get store breakdown',
      error: error.message,
    });
  }
};

/**
 * Get dashboard overview
 */
export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Get total spending
    const totalPipeline = [
      {
        $match: {
          userId: user._id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$total' },
          receiptCount: { $sum: 1 },
          avgReceiptAmount: { $avg: '$total' },
        },
      },
    ];

    const [totals] = await Receipt.aggregate(totalPipeline);

    // Get category breakdown
    const categoryPipeline = [
      {
        $match: {
          userId: user._id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          totalSpent: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ];

    const topCategories = await Receipt.aggregate(categoryPipeline as any);

    res.status(200).json({
      success: true,
      data: {
        totalSpent: totals ? Math.round(totals.totalSpent * 100) / 100 : 0,
        receiptCount: totals ? totals.receiptCount : 0,
        avgReceiptAmount: totals ? Math.round(totals.avgReceiptAmount * 100) / 100 : 0,
        topCategories: topCategories.map((cat) => ({
          category: cat._id,
          totalSpent: Math.round(cat.totalSpent * 100) / 100,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard overview',
      error: error.message,
    });
  }
};
