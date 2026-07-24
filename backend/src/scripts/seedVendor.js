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

    const vendorsToSeed = [
      {
        name: 'Fashion Hub',
        email: 'fashionhub@example.com',
        password: 'vendor123',
        phone: '+1234567890',
        storeName: 'Fashion Hub Store',
        storeDescription: 'Seeded vendor account',
        status: 'approved',
        isVerified: true,
        commissionRate: 10,
        governmentIdDocumentUrl: '',
      },
      {
        name: 'Amit mankar',
        email: 'amitmankar1052@gmail.com',
        password: 'vendor123',
        phone: '+91 7999810233',
        storeName: 'Appzeto',
        storeDescription: 'Seeded Amit Mankar vendor account',
        status: 'approved',
        isVerified: true,
        commissionRate: 15,
        governmentIdDocumentUrl: '',
      }
    ];

    for (const data of vendorsToSeed) {
      const { email, password, ...rest } = data;
      const hashedPassword = await bcrypt.hash(password, 12);
      const existing = await Vendor.findOne({ email });

      if (existing) {
        existing.password = hashedPassword;
        existing.status = 'approved';
        existing.isVerified = true;
        existing.name = existing.name || rest.name;
        existing.storeName = existing.storeName || rest.storeName;
        existing.phone = existing.phone || rest.phone;
        existing.commissionRate = existing.commissionRate || rest.commissionRate;
        await existing.save();
        console.log(`✅ Vendor credentials updated: ${email} / ${password}`);
      } else {
        await Vendor.create({
          email,
          password: hashedPassword,
          ...rest
        });
        console.log(`✅ Vendor created: ${email} / ${password}`);
      }
    }
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedVendor();
