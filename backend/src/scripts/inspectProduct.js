import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';

const checkCategories = async () => {
    try {
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        await mongoose.connect(dbUrl);
        const Category = mongoose.model('Category');

        const categories = await Category.find({}).select('name workflowSteps parentId').lean();
        console.log("📁 ALL CATEGORIES IN DB:", JSON.stringify(categories, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkCategories();
