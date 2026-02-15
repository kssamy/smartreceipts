import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  householdId?: mongoose.Types.ObjectId;
  role: 'admin' | 'member' | 'viewer';
  settings: {
    currency: string;
    notifications: {
      priceDrops: boolean;
      weeklyReport: boolean;
      budgetAlerts: boolean;
    };
  };
  priceAlerts: {
    enabled: boolean;
    thresholds: {
      anyDrop: boolean;
      percent10: boolean;
      percent20: boolean;
      percent30: boolean;
    };
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    maxAlertsPerDay: number;
  };
  pushNotificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'admin',
    },
    settings: {
      currency: {
        type: String,
        default: 'USD',
      },
      notifications: {
        priceDrops: {
          type: Boolean,
          default: true,
        },
        weeklyReport: {
          type: Boolean,
          default: true,
        },
        budgetAlerts: {
          type: Boolean,
          default: true,
        },
      },
    },
    priceAlerts: {
      enabled: {
        type: Boolean,
        default: true,
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
      quietHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        start: {
          type: String,
          default: '22:00',
        },
        end: {
          type: String,
          default: '08:00',
        },
      },
      maxAlertsPerDay: {
        type: Number,
        default: 10,
      },
    },
    pushNotificationToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ householdId: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
