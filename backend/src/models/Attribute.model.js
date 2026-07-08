import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const AttributeSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  type: { type: String, default: "custom" },
  setIds: { type: [String] }
}, {
  timestamps: true,
  collection: 'Attribute'
});

const MongooseAttribute = mongoose.models.Attribute || mongoose.model('Attribute', AttributeSchema);

export const Attribute = wrapModel(MongooseAttribute);
export default Attribute;
