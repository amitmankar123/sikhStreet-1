import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import '../models/Category.model.js'; // Ensure model registered

const inspectCategories = async () => {
    await connectDB();
    const Category = mongoose.model('Category');
    const categories = await Category.find({}).lean();
    console.log(`Total categories in DB: ${categories.length}`);
    console.log(JSON.stringify(categories.slice(0, 15), null, 2));
    process.exit(0);
};

inspectCategories();
