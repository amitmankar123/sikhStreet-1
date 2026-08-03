import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const DeliveryBoySchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  phone: { type: String },
  address: { type: String },
  role: { type: String, default: 'delivery' },
  vehicleType: { type: String },
  vehicleNumber: { type: String },
  isActive: { type: Boolean, default: true },
  applicationStatus: { type: String, default: 'approved', enum: ['pending', 'approved', 'rejected'] },
  documentUrls: {
    drivingLicense: { type: String },
    aadharCard: { type: String }
  },
  rating: { type: Number, default: 5 },
  totalDeliveries: { type: Number, default: 0 },
  pendingDeliveries: { type: Number, default: 0 },
  cashInHand: { type: Number, default: 0 },
  refreshTokenHash: { type: String },
  refreshTokenExpiresAt: { type: Date }
}, {
  timestamps: true,
  collection: 'DeliveryBoy'
});

const MongooseDeliveryBoy = mongoose.models.DeliveryBoy || mongoose.model('DeliveryBoy', DeliveryBoySchema);

export const DeliveryBoy = wrapModel(MongooseDeliveryBoy);
export default DeliveryBoy;
