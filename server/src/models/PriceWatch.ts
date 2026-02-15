import mongoose, { Document, Schema } from 'mongoose';

export interface IBestPrice {
  price: number;
  store: string;
  date: Date;
  url: string;
}

export interface IThresholds {
  anyDrop: boolean;
  percent10: boolean;
  percent20: boolean;
  percent30: boolean;
}

export interface IPriceWatch extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  receiptId: mongoose.Types.ObjectId;
  itemName: string;
  normalizedName: string;
  category: string;
  originalPrice: number;
  storeName: string;
  purchaseDate: Date;
  expiresAt: Date;
  thresholds: IThresholds;
  isActive: boolean;
  lastCheckedAt?: Date;
  bestPriceFound?: IBestPrice;
  createdAt: Date;
  updatedAt: Date;
}

const priceWatchSchema = new Schema<IPriceWatch>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiptId: {
      type: Schema.Types.ObjectId,
      ref: 'Receipt',
      required: true,
      index: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    thresholds: {
      anyDrop: {
        type: Boolean,
        default: false,
      },
      percent10: {
        type: Boolean,
        default: true,
      },
      percent20: {
        type: Boolean,
        default: true,
      },
      percent30: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastCheckedAt: {
      type: Date,
    },
    bestPriceFound: {
      price: {
        type: Number,
      },
      store: {
        type: String,
      },
      date: {
        type: Date,
      },
      url: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
priceWatchSchema.index({ userId: 1, isActive: 1, expiresAt: 1 });
priceWatchSchema.index({ isActive: 1, expiresAt: 1 });
priceWatchSchema.index({ userId: 1, createdAt: -1 });

// TTL index to automatically delete expired watches (runs every 60 seconds)
priceWatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPriceWatch>('PriceWatch', priceWatchSchema);
