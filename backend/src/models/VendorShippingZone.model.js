import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const VendorShippingZoneSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendorId: { type: String },
  name: { type: String },
  countries: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'VendorShippingZone'
});

const MongooseVendorShippingZone = mongoose.models.VendorShippingZone || mongoose.model('VendorShippingZone', VendorShippingZoneSchema);

export const VendorShippingZone = wrapModel(MongooseVendorShippingZone);
export default VendorShippingZone;
