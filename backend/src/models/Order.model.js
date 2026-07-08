import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const OrderSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  orderId: { type: String, unique: true },
  userId: { type: String },
  guestInfo: { type: mongoose.Schema.Types.Mixed },
  items: { type: mongoose.Schema.Types.Mixed },
  vendorItems: { type: mongoose.Schema.Types.Mixed },
  shippingAddress: { type: mongoose.Schema.Types.Mixed },
  paymentMethod: { type: String },
  paymentStatus: { type: String, default: "pending" },
  status: { type: String, default: "pending" },
  subtotal: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  couponCode: { type: String },
  couponDiscount: { type: Number, default: 0 },
  idempotencyKey: { type: String },
  idempotencyScope: { type: String },
  trackingNumber: { type: String, unique: true },
  deliveryBoyId: { type: String },
  deliveryOtpHash: { type: String },
  deliveryOtpExpiry: { type: Date },
  deliveryOtpSentAt: { type: Date },
  deliveryOtpDebug: { type: String },
  deliveryOtpVerifiedAt: { type: Date },
  deliveryOtpAttempts: { type: Number, default: 0 },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
  isCashSettled: { type: Boolean, default: false },
  settledAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String }
}, {
  timestamps: true,
  collection: 'Order'
});

const MongooseOrder = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export const Order = wrapModel(MongooseOrder);
export default Order;
