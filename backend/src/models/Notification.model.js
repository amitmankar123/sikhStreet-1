import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const NotificationSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  recipientId: { type: String },
  recipientType: { type: String },
  title: { type: String },
  message: { type: String },
  type: { type: String, default: "system" },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'Notification'
});

const MongooseNotification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export const Notification = wrapModel(MongooseNotification);
export default Notification;
