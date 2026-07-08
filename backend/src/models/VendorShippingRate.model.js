import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const VendorShippingRateSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendorId: { type: String },
  zoneId: { type: String },
  name: { type: String },
  rate: { type: Number },
  freeShippingThreshold: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'VendorShippingRate'
});

const MongooseVendorShippingRate = mongoose.models.VendorShippingRate || mongoose.model('VendorShippingRate', VendorShippingRateSchema);

export const VendorShippingRate = wrapModel(MongooseVendorShippingRate);
export default VendorShippingRate;
