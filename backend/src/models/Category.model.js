import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const CategorySchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  slug: { type: String, unique: true },
  description: { type: String, default: "" },
  image: { type: String },
  icon: { type: String },
  parentId: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  productType: { type: String, enum: ['physical', 'digital'], default: 'physical' },
  workflowSteps: { type: [String], default: [] },
  group: { type: String, default: "" }
}, {
  timestamps: true,
  collection: 'Category'
});

const MongooseCategory = mongoose.models.Category || mongoose.model('Category', CategorySchema);

export const Category = wrapModel(MongooseCategory);
export default Category;
