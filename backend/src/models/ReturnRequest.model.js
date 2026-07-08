import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const ReturnRequestSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  orderId: { type: String },
  userId: { type: String },
  vendorId: { type: String },
  items: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String },
  status: { type: String, default: "pending" },
  refundAmount: { type: Number },
  refundStatus: { type: String },
  adminNote: { type: String },
  rejectionReason: { type: String },
  images: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'ReturnRequest'
});

const MongooseReturnRequest = mongoose.models.ReturnRequest || mongoose.model('ReturnRequest', ReturnRequestSchema);

export const ReturnRequest = wrapModel(MongooseReturnRequest);
export default ReturnRequest;
