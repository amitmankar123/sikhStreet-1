import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const AttributeSetSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  attributeIds: { type: [String] }
}, {
  timestamps: true,
  collection: 'AttributeSet'
});

const MongooseAttributeSet = mongoose.models.AttributeSet || mongoose.model('AttributeSet', AttributeSetSchema);

export const AttributeSet = wrapModel(MongooseAttributeSet);
export default AttributeSet;
