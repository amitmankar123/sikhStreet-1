import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const ProductTemplateSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  supportedProductTypes: { type: [String], default: ['physical'] },
  steps: { type: mongoose.Schema.Types.Mixed, default: [] },
  workflowSteps: { type: [String], default: ['basic_info', 'pricing', 'inventory', 'shipping', 'seo', 'preview', 'publish'] },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'ProductTemplate'
});

const MongooseProductTemplate = mongoose.models.ProductTemplate || mongoose.model('ProductTemplate', ProductTemplateSchema);

export const ProductTemplate = wrapModel(MongooseProductTemplate);
export default ProductTemplate;
