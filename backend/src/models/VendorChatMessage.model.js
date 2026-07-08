import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const VendorChatMessageSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  threadId: { type: String },
  senderType: { type: String },
  senderId: { type: String },
  message: { type: String }
}, {
  timestamps: true,
  collection: 'VendorChatMessage'
});

const MongooseVendorChatMessage = mongoose.models.VendorChatMessage || mongoose.model('VendorChatMessage', VendorChatMessageSchema);

export const VendorChatMessage = wrapModel(MongooseVendorChatMessage);
export default VendorChatMessage;
