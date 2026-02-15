import { Router } from 'express';
import {
  getPriceWatches,
  getPriceHistory,
  createPriceWatch,
  updateThresholds,
  deletePriceWatch,
  getPriceAlerts,
  getSavingsSummary,
} from '../controllers/priceWatchController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/price-watch - Get all price watches for user
router.get('/', getPriceWatches);

// GET /api/v1/price-watch/alerts - Get price alerts for user
router.get('/alerts', getPriceAlerts);

// GET /api/v1/price-watch/savings - Get savings summary
router.get('/savings', getSavingsSummary);

// GET /api/v1/price-watch/:watchId/history - Get price history for a watch
router.get('/:watchId/history', getPriceHistory);

// POST /api/v1/price-watch - Create a new price watch manually
router.post('/', createPriceWatch);

// PATCH /api/v1/price-watch/:watchId/thresholds - Update alert thresholds
router.patch('/:watchId/thresholds', updateThresholds);

// DELETE /api/v1/price-watch/:watchId - Delete (deactivate) a price watch
router.delete('/:watchId', deletePriceWatch);

export default router;
