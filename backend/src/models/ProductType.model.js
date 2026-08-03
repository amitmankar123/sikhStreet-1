import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const ProductTypeSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  controls: {
    inventory: { type: Boolean, default: false },
    shipping: { type: Boolean, default: false },
    downloads: { type: Boolean, default: false },
    licensing: { type: Boolean, default: false },
    media: { type: Boolean, default: true },
    variants: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'ProductType'
});

const MongooseProductType = mongoose.models.ProductType || mongoose.model('ProductType', ProductTypeSchema);

export const ProductType = wrapModel(MongooseProductType);
export default ProductType;
