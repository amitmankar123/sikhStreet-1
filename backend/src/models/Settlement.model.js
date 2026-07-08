import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const SettlementSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendorId: { type: String },
  commissionIds: { type: mongoose.Schema.Types.Mixed },
  amount: { type: Number },
  paymentMethod: { type: String, default: "bank_transfer" },
  transactionId: { type: String },
  notes: { type: String },
  status: { type: String, default: "completed" }
}, {
  timestamps: true,
  collection: 'Settlement'
});

const MongooseSettlement = mongoose.models.Settlement || mongoose.model('Settlement', SettlementSchema);

export const Settlement = wrapModel(MongooseSettlement);
export default Settlement;
