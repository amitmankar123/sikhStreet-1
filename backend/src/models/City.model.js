import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const CitySchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  state: { type: String },
  country: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'City'
});

const MongooseCity = mongoose.models.City || mongoose.model('City', CitySchema);

export const City = wrapModel(MongooseCity);
export default City;
