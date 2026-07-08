import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const AddressSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String },
  name: { type: String },
  fullName: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  location: { type: mongoose.Schema.Types.Mixed },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'Address'
});

const MongooseAddress = mongoose.models.Address || mongoose.model('Address', AddressSchema);

export const Address = wrapModel(MongooseAddress);
export default Address;
