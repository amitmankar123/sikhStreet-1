import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const CampaignSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String },
  slug: { type: String, unique: true },
  description: { type: String },
  type: { type: String },
  status: { type: String, default: "draft" },
  isActive: { type: Boolean, default: true },
  discountType: { type: String, default: "percentage" },
  discountValue: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  productIds: { type: mongoose.Schema.Types.Mixed },
  categoryId: { type: String },
  route: { type: String },
  autoCreateBanner: { type: Boolean, default: true },
  pageConfig: { type: mongoose.Schema.Types.Mixed },
  bannerConfig: { type: mongoose.Schema.Types.Mixed },
  targetAudience: { type: String, default: "all" },
  content: { type: String },
  scheduledAt: { type: Date },
  sentAt: { type: Date }
}, {
  timestamps: true,
  collection: 'Campaign'
});

const MongooseCampaign = mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);

export const Campaign = wrapModel(MongooseCampaign);
export default Campaign;
