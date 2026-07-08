import mongoose from 'mongoose';
import '../models/index.js';

const connectDB = async () => {
  try {
    const mongoUrl = process.env.DATABASE_URL;
    if (!mongoUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB Connected via Mongoose ODM');

    // Ensure 2dsphere index exists on Vendor location for Geo-spatial queries
    try {
      await mongoose.connection.db.collection('Vendor').createIndex(
        { location: '2dsphere' },
        { name: 'location_2dsphere' }
      );
      console.log('🌐 Geo-spatial 2dsphere index ensured on Vendor collection');
    } catch (indexError) {
      console.log('ℹ️ Geo-spatial index setup status:', indexError.message);
    }
  } catch (error) {
    console.error('📦 Server startup failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
