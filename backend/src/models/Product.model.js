import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const ProductSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  sku: { type: String, unique: true },
  name: { type: String },
  slug: { type: String, unique: true },
  description: { type: String },
  price: { type: Number },
  originalPrice: { type: Number },
  unit: { type: String, default: "Piece" },
  images: { type: mongoose.Schema.Types.Mixed },
  image: { type: String },
  video: { type: String },
  categoryId: { type: String },
  brandId: { type: String },
  vendorId: { type: String },
  stock: { type: String, default: "in_stock" },
  stockQuantity: { type: Number, default: 0 },
  totalAllowedQuantity: { type: Number },
  minimumOrderQuantity: { type: Number, default: 1 },
  lowStockThreshold: { type: Number, default: 10 },
  variants: { type: mongoose.Schema.Types.Mixed },
  flashSale: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  codAllowed: { type: Boolean, default: true },
  returnable: { type: Boolean, default: true },
  cancelable: { type: Boolean, default: true },
  taxIncluded: { type: Boolean, default: false },
  warrantyPeriod: { type: String },
  guaranteePeriod: { type: String },
  hsnCode: { type: String },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  seoTitle: { type: String },
  seoDescription: { type: String },
  relatedProducts: { type: mongoose.Schema.Types.Mixed },
  faqs: { type: mongoose.Schema.Types.Mixed },
  tags: { type: mongoose.Schema.Types.Mixed },
  specifications: { type: mongoose.Schema.Types.Mixed },
  turbanConfig: { type: mongoose.Schema.Types.Mixed },
  productType: { type: String, enum: ['physical', 'digital'], default: 'physical' },
  digitalConfig: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'Product'
});

const MongooseProduct = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export const Product = wrapModel(MongooseProduct);
export default Product;
