import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';
import bcrypt from 'bcryptjs';

const seedVendor = async () => {
  try {
    console.log('Connecting to database...');
    const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
    if (!dbUrl) {
        throw new Error('Database connection URL not set in environment');
    }
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to MongoDB');

    const Vendor = mongoose.model('Vendor');

    const email = 'fashionhub@example.com';
    const password = 'vendor123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const existing = await Vendor.findOne({ email });

    if (existing) {
      existing.name = 'Fashion Hub';
      existing.storeName = existing.storeName || 'Fashion Hub Store';
      existing.phone = existing.phone || '+1234567890';
      existing.password = hashedPassword;
      existing.status = 'approved';
      existing.isVerified = true;
      existing.commissionRate = 10;
      existing.governmentIdDocumentUrl = existing.governmentIdDocumentUrl || '';
      await existing.save();
      console.log('✅ Vendor credentials updated: fashionhub@example.com / vendor123');
    } else {
      await Vendor.create({
          name: 'Fashion Hub',
          email,
          password: hashedPassword,
          phone: '+1234567890',
          storeName: 'Fashion Hub Store',
          storeDescription: 'Seeded vendor account',
          status: 'approved',
          isVerified: true,
          commissionRate: 10,
          governmentIdDocumentUrl: '',
      });
      console.log('✅ Vendor created: fashionhub@example.com / vendor123');
    }
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedVendor();
