import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const CouponSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  code: { type: String, unique: true },
  name: { type: String },
  type: { type: String },
  value: { type: Number },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startsAt: { type: Date },
  expiresAt: { type: Date }
}, {
  timestamps: true,
  collection: 'Coupon'
});

const MongooseCoupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

export const Coupon = wrapModel(MongooseCoupon);
export default Coupon;
