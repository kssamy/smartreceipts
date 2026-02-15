import mongoose, { Document, Schema } from 'mongoose';

export interface IReceiptItem {
  name: string;
  normalizedName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  confidence?: number;
  priceTrack?: boolean;
}

export interface IReceipt extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  storeName: string;
  storeAddress?: string;
  date: Date;
  items: IReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  imageUrl?: string;
  ocrMethod: 'on-device' | 'cloud' | 'manual';
  ocrConfidence?: number;
  verified: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const receiptItemSchema = new Schema<IReceiptItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Groceries',
        'Dining',
        'Electronics',
        'Clothing',
        'Health',
        'Home',
        'Transportation',
        'Entertainment',
        'Subscriptions',
        'Other',
      ],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    priceTrack: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const receiptSchema = new Schema<IReceipt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      index: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    storeAddress: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    items: [receiptItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
    },
    ocrMethod: {
      type: String,
      enum: ['on-device', 'cloud', 'manual'],
      default: 'on-device',
    },
    ocrConfidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
receiptSchema.index({ userId: 1, date: -1 });
receiptSchema.index({ householdId: 1, date: -1 });
receiptSchema.index({ userId: 1, createdAt: -1 });
receiptSchema.index({ 'items.category': 1 });
receiptSchema.index({ storeName: 1, date: -1 });

// TTL index for archiving old receipts (Phase 2+)
// receiptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

export default mongoose.model<IReceipt>('Receipt', receiptSchema);
