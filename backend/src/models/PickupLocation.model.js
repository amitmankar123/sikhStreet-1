import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const PickupLocationSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendorId: { type: String },
  name: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  phone: { type: String },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'PickupLocation'
});

const MongoosePickupLocation = mongoose.models.PickupLocation || mongoose.model('PickupLocation', PickupLocationSchema);

export const PickupLocation = wrapModel(MongoosePickupLocation);
export default PickupLocation;
