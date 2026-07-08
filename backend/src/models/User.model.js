import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  phone: { type: String },
  avatar: { type: String },
  role: { type: String, default: "customer" },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetOtp: { type: String },
  resetOtpExpiry: { type: Date },
  resetOtpVerified: { type: Boolean, default: false },
  refreshTokenHash: { type: String },
  refreshTokenExpiresAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpiry: { type: Date }
}, {
  timestamps: true,
  collection: 'User'
});

const MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);

export const User = wrapModel(MongooseUser);
export default User;
