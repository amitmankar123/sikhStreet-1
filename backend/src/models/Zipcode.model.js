import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const ZipcodeSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  code: { type: String, unique: true },
  cityId: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'Zipcode'
});

const MongooseZipcode = mongoose.models.Zipcode || mongoose.model('Zipcode', ZipcodeSchema);

export const Zipcode = wrapModel(MongooseZipcode);
export default Zipcode;
