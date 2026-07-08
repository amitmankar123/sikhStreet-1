import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const ReviewSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  productId: { type: String },
  userId: { type: String },
  orderId: { type: String },
  rating: { type: Number },
  comment: { type: String },
  images: { type: mongoose.Schema.Types.Mixed },
  helpfulCount: { type: Number, default: 0 },
  notHelpfulCount: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  vendorResponse: { type: String, default: "" },
  responseDate: { type: Date },
  isVerifiedPurchase: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'Review'
});

const MongooseReview = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export const Review = wrapModel(MongooseReview);
export default Review;
