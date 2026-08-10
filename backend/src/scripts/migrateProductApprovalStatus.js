import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';

const migrateProductApprovalStatus = async () => {
  try {
    console.log('Connecting to database...');
    const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sikhstreet";
    try {
      await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to MongoDB via', dbUrl);
    } catch (e) {
      const localUrl = "mongodb://127.0.0.1:27017/sikhstreet";
      console.log('Connection failed, falling back to local MongoDB:', localUrl);
      await mongoose.connect(localUrl);
      console.log('✅ Connected to local MongoDB');
    }

    const Product = mongoose.model('Product');

    const result = await Product.updateMany(
      { approvalStatus: { $exists: false } },
      { $set: { approvalStatus: 'active' } }
    );

    console.log(`✅ Updated ${result.modifiedCount || 0} products to have approvalStatus: 'active'.`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

migrateProductApprovalStatus();
