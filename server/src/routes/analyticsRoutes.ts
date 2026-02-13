import { Router } from 'express';
import {
  getSpendingByCategory,
  getSpendingTrends,
  getTopItems,
  getSpendingByStore,
  getDashboardOverview,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/analytics/overview
 * @desc    Get dashboard overview
 * @access  Private
 */
router.get('/overview', getDashboardOverview);

/**
 * @route   GET /api/v1/analytics/category
 * @desc    Get spending breakdown by category
 * @access  Private
 */
router.get('/category', getSpendingByCategory);

/**
 * @route   GET /api/v1/analytics/trends
 * @desc    Get spending trends over time
 * @access  Private
 */
router.get('/trends', getSpendingTrends);

/**
 * @route   GET /api/v1/analytics/top-items
 * @desc    Get top purchased items
 * @access  Private
 */
router.get('/top-items', getTopItems);

/**
 * @route   GET /api/v1/analytics/stores
 * @desc    Get spending breakdown by store
 * @access  Private
 */
router.get('/stores', getSpendingByStore);

export default router;
