import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const TicketTypeSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'TicketType'
});

const MongooseTicketType = mongoose.models.TicketType || mongoose.model('TicketType', TicketTypeSchema);

export const TicketType = wrapModel(MongooseTicketType);
export default TicketType;
