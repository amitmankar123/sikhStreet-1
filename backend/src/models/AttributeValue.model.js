import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const AttributeValueSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  attributeId: { type: String },
  value: { type: String },
  colorCode: { type: String }
}, {
  timestamps: true,
  collection: 'AttributeValue'
});

const MongooseAttributeValue = mongoose.models.AttributeValue || mongoose.model('AttributeValue', AttributeValueSchema);

export const AttributeValue = wrapModel(MongooseAttributeValue);
export default AttributeValue;
