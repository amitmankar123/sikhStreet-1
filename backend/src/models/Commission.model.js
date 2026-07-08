import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const CommissionSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  orderId: { type: String },
  vendorId: { type: String },
  vendorName: { type: String },
  subtotal: { type: Number },
  commissionRate: { type: Number },
  commission: { type: Number },
  vendorEarnings: { type: Number },
  status: { type: String, default: "pending" },
  paidAt: { type: Date },
  settlementId: { type: String }
}, {
  timestamps: true,
  collection: 'Commission'
});

const MongooseCommission = mongoose.models.Commission || mongoose.model('Commission', CommissionSchema);

export const Commission = wrapModel(MongooseCommission);
export default Commission;
