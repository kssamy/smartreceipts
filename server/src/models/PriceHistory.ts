import mongoose, { Document, Schema } from 'mongoose';

export interface IPriceHistory extends Document {
  _id: mongoose.Types.ObjectId;
  priceWatchId: mongoose.Types.ObjectId;
  store: string;
  price: number;
  currency: string;
  inStock: boolean;
  productUrl?: string;
  scrapedAt: Date;
  productId?: string;
  upc?: string;
  createdAt: Date;
}

const priceHistorySchema = new Schema<IPriceHistory>(
  {
    priceWatchId: {
      type: Schema.Types.ObjectId,
      ref: 'PriceWatch',
      required: true,
      index: true,
    },
    store: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD'],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    productUrl: {
      type: String,
      trim: true,
    },
    scrapedAt: {
      type: Date,
      required: true,
      index: true,
    },
    productId: {
      type: String,
      trim: true,
    },
    upc: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for efficient queries
priceHistorySchema.index({ priceWatchId: 1, scrapedAt: -1 });
priceHistorySchema.index({ priceWatchId: 1, store: 1, scrapedAt: -1 });
priceHistorySchema.index({ store: 1, scrapedAt: -1 });

// TTL index to delete old price history after 35 days
priceHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 35 * 24 * 60 * 60 });

export default mongoose.model<IPriceHistory>('PriceHistory', priceHistorySchema);
