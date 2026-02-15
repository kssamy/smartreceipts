import mongoose, { Document, Schema } from 'mongoose';

export interface IPriceAlert extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  priceWatchId: mongoose.Types.ObjectId;
  type: 'price_drop' | 'threshold_met' | 'expiring_soon';
  message: string;
  originalPrice: number;
  newPrice: number;
  savings: number;
  savingsPercent: number;
  store: string;
  notificationSent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

const priceAlertSchema = new Schema<IPriceAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    priceWatchId: {
      type: Schema.Types.ObjectId,
      ref: 'PriceWatch',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['price_drop', 'threshold_met', 'expiring_soon'],
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    newPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    savings: {
      type: Number,
      required: true,
    },
    savingsPercent: {
      type: Number,
      required: true,
    },
    store: {
      type: String,
      required: true,
      trim: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for efficient queries
priceAlertSchema.index({ userId: 1, createdAt: -1 });
priceAlertSchema.index({ priceWatchId: 1, createdAt: -1 });
priceAlertSchema.index({ userId: 1, notificationSent: 1 });

// TTL index to delete old alerts after 90 days
priceAlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IPriceAlert>('PriceAlert', priceAlertSchema);
