import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const AnswerSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String, required: true },
  userType: { type: String, enum: ['buyer', 'vendor', 'admin'], default: 'buyer' },
  userName: { type: String, required: true }, // Store name for quick display
  answer: { type: String, required: true },
}, { timestamps: true });

const ProductQuestionSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  question: { type: String, required: true },
  answers: [AnswerSchema],
  status: { type: String, enum: ['active', 'hidden'], default: 'active' }
}, {
  timestamps: true,
  collection: 'ProductQuestion'
});

const MongooseProductQuestion = mongoose.models.ProductQuestion || mongoose.model('ProductQuestion', ProductQuestionSchema);

export const ProductQuestion = wrapModel(MongooseProductQuestion);
export default ProductQuestion;
