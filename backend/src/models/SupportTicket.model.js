import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const SupportTicketSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String },
  vendorId: { type: String },
  ticketTypeId: { type: String },
  subject: { type: String },
  status: { type: String, default: "open" },
  priority: { type: String, default: "medium" },
  messages: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'SupportTicket'
});

const MongooseSupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);

export const SupportTicket = wrapModel(MongooseSupportTicket);
export default SupportTicket;
