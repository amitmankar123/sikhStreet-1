import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const AdminSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String, default: "admin" },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  refreshTokenHash: { type: String },
  refreshTokenExpiresAt: { type: Date }
}, {
  timestamps: true,
  collection: 'Admin'
});

const MongooseAdmin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

export const Admin = wrapModel(MongooseAdmin);
export default Admin;
