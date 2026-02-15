import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator';
import {
  createReceipt,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  toggleItemPriceTracking,
} from '../controllers/receiptController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/receipts
 * @desc    Create a new receipt
 * @access  Private
 */
router.post(
  '/',
  validate([
    body('storeName').notEmpty().withMessage('Store name is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.name').notEmpty().withMessage('Item name is required'),
    body('items.*.totalPrice').isFloat({ min: 0 }).withMessage('Valid item price is required'),
    body('subtotal').isFloat({ min: 0 }).withMessage('Valid subtotal is required'),
    body('tax').isFloat({ min: 0 }).withMessage('Valid tax amount is required'),
    body('total').isFloat({ min: 0 }).withMessage('Valid total is required'),
  ]),
  createReceipt
);

/**
 * @route   GET /api/v1/receipts
 * @desc    Get all receipts for the authenticated user
 * @access  Private
 */
router.get('/', getReceipts);

/**
 * @route   GET /api/v1/receipts/:id
 * @desc    Get a single receipt by ID
 * @access  Private
 */
router.get('/:id', getReceiptById);

/**
 * @route   PUT /api/v1/receipts/:id
 * @desc    Update a receipt
 * @access  Private
 */
router.put('/:id', updateReceipt);

/**
 * @route   PATCH /api/v1/receipts/:id/items/toggle-tracking
 * @desc    Toggle price tracking for a specific item
 * @access  Private
 */
router.patch(
  '/:id/items/toggle-tracking',
  validate([
    body('itemIndex').isInt({ min: 0 }).withMessage('Valid item index is required'),
    body('priceTrack').isBoolean().withMessage('priceTrack must be a boolean'),
  ]),
  toggleItemPriceTracking
);

/**
 * @route   DELETE /api/v1/receipts/:id
 * @desc    Delete a receipt
 * @access  Private
 */
router.delete('/:id', deleteReceipt);

export default router;
