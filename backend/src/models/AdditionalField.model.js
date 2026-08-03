import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const AdditionalFieldSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'text', 'textarea', 'rich_text', 'number', 'decimal', 'currency', 
      'date', 'time', 'checkbox', 'radio', 'toggle', 'dropdown', 'multi_select', 
      'image_upload', 'video_upload', 'document_upload', 'color_picker', 
      'dimension', 'weight', 'sku', 'barcode', 'url', 'email', 'phone'
    ], 
    default: 'text' 
  },
  placeholder: { type: String, default: "" },
  helpText: { type: String, default: "" },
  description: { type: String, default: "" },
  required: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  defaultValue: { type: mongoose.Schema.Types.Mixed, default: null },
  validationRules: { type: mongoose.Schema.Types.Mixed, default: {} },
  options: { type: [String], default: [] },
  displayOrder: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'AdditionalField'
});

const MongooseAdditionalField = mongoose.models.AdditionalField || mongoose.model('AdditionalField', AdditionalFieldSchema);

export const AdditionalField = wrapModel(MongooseAdditionalField);
export default AdditionalField;
