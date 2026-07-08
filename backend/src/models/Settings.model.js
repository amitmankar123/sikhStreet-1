import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

const SettingsSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  key: { type: String, unique: true },
  value: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'Settings'
});

const MongooseSettings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export const Settings = wrapModel(MongooseSettings);
export default Settings;
