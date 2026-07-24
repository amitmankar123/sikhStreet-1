import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import '../models/Product.model.js';
import '../models/Vendor.model.js';

const inspectProducts = async () => {
    await connectDB();
    const Product = mongoose.model('Product');
    const products = await Product.find({}).lean();
    console.log(`Total products in DB: ${products.length}`);
    products.forEach(p => {
        console.log(`- [${p._id}] ${p.name} | Category: ${p.categoryId} | Vendor: ${p.vendorId} | Active: ${p.isActive}`);
    });
    process.exit(0);
};

inspectProducts();
