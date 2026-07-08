import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const WishlistSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String, unique: true }
}, {
  timestamps: true,
  collection: 'Wishlist'
});

const MongooseWishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', WishlistSchema);

export const Wishlist = wrapModel(MongooseWishlist);
export default Wishlist;
