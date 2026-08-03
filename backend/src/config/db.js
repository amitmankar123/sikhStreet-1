import mongoose from 'mongoose';
import dns from 'dns';
import '../models/index.js';

// Fallback DNS to resolve Atlas querySrv issues on some local networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore errors if setServers is restricted or fails
}


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
