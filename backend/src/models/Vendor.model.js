import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const VendorSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'VDR-' + crypto.randomBytes(3).toString('hex').toUpperCase() },
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  phone: { type: String },
  storeName: { type: String },
  storeLogo: { type: String },
  storeBanner: { type: String },
  storeDescription: { type: String },
  storePolicies: { type: String },
  refundPolicy: { type: String },
  shippingPolicy: { type: String },
  status: { type: String, default: "pending" },
  suspensionReason: { type: String },
  commissionRate: { type: Number, default: 10 },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  location: { type: mongoose.Schema.Types.Mixed },
  shippingEnabled: { type: Boolean, default: true },
  freeShippingThreshold: { type: Number, default: 100 },
  defaultShippingRate: { type: Number, default: 5 },
  shippingMethods: { type: mongoose.Schema.Types.Mixed },
  handlingTime: { type: Number, default: 1 },
  processingTime: { type: Number, default: 1 },
  address: { type: mongoose.Schema.Types.Mixed },
  bankDetails: { type: mongoose.Schema.Types.Mixed },
  documents: { type: mongoose.Schema.Types.Mixed },
  businessName: { type: String },
  businessType: { type: String },
  businessCountry: { type: String },
  businessAddress: { type: String },
  kycDocumentType: { type: String },
  kycDocumentUrl: { type: String },
  vendorType: { type: String, default: "Individual" },
  vendorCountry: { type: String, default: "" },
  governmentIdDocumentUrl: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetOtp: { type: String },
  resetOtpExpiry: { type: Date },
  resetOtpVerified: { type: Boolean, default: false },
  isOnboarded: { type: Boolean, default: false },
  refreshTokenHash: { type: String },
  refreshTokenExpiresAt: { type: Date },
  joinDate: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'Vendor'
});

const MongooseVendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

export const Vendor = wrapModel(MongooseVendor);
export default Vendor;
