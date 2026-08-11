import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const VendorChatThreadSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendorId: { type: String },
  orderRef: { type: String },
  orderDisplayId: { type: String },
  customerUserId: { type: String },
  customerName: { type: String, default: "Customer" },
  customerEmail: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  lastMessage: { type: String, default: "" },
  lastActivity: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
  customerUnreadCount: { type: Number, default: 0 },
  status: { type: String, default: "active" },
  threadType: { type: String, enum: ['order', 'general'], default: 'order' },
  vendorStoreName: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'VendorChatThread'
});

const MongooseVendorChatThread = mongoose.models.VendorChatThread || mongoose.model('VendorChatThread', VendorChatThreadSchema);

export const VendorChatThread = wrapModel(MongooseVendorChatThread);
export default VendorChatThread;
