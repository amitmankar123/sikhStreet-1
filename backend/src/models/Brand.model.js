import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const BrandSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  slug: { type: String, unique: true },
  logo: { type: String },
  description: { type: String },
  website: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'Brand'
});

const MongooseBrand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);

export const Brand = wrapModel(MongooseBrand);
export default Brand;
