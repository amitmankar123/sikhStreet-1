import dotenv from 'dotenv';
dotenv.config();
import connectDB from './src/config/db.js';
import mongoose from 'mongoose';

async function check() {
    try {
        await connectDB();
        const Vendor = mongoose.model('Vendor');
        console.log("Fetching vendors...");
        const vendors = await Vendor.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        
        console.log("Recent vendors found:");
        vendors.forEach(v => {
            console.log(`- Store: ${v.storeName}, Email: ${v.email}, Status: ${v.status}, isVerified: ${v.isVerified}, OTP in DB: ${v.otp}`);
        });
    } catch (err) {
        console.error("Error reading database:", err);
    } finally {
        await mongoose.disconnect();
    }
}
check();
