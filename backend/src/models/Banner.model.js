import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const BannerSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  title: { type: String },
  subtitle: { type: String },
  description: { type: String },
  image: { type: String },
  link: { type: String },
  type: { type: String, default: "banner" },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date },
  endDate: { type: Date }
}, {
  timestamps: true,
  collection: 'Banner'
});

const MongooseBanner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

export const Banner = wrapModel(MongooseBanner);
export default Banner;
