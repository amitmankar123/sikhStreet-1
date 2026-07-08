import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const VendorDocumentSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendorId: { type: String },
  name: { type: String },
  category: { type: String, default: "Other" },
  expiryDate: { type: Date },
  status: { type: String, default: "pending" },
  fileUrl: { type: String },
  filePublicId: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  fileSize: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'VendorDocument'
});

const MongooseVendorDocument = mongoose.models.VendorDocument || mongoose.model('VendorDocument', VendorDocumentSchema);

export const VendorDocument = wrapModel(MongooseVendorDocument);
export default VendorDocument;
