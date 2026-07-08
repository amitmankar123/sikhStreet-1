import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const WishlistItemSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  wishlistId: { type: String },
  productId: { type: String },
  addedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'WishlistItem'
});

const MongooseWishlistItem = mongoose.models.WishlistItem || mongoose.model('WishlistItem', WishlistItemSchema);

export const WishlistItem = wrapModel(MongooseWishlistItem);
export default WishlistItem;
