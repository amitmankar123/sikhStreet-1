import mongoose from 'mongoose';
import '../../src/models/index.js';

const checkCategory = async () => {
    const localUrl = "mongodb://localhost:27017/sikhstreet";
    console.log(`Connecting to local MongoDB: ${localUrl}`);
    try {
        await mongoose.connect(localUrl);
        const Category = mongoose.model('Category');
        const cat = await Category.findById('1d527ea0-8ea0-46a2-b325-2bdf0f7b6ca3').lean();
        console.log("CATEGORY:", JSON.stringify(cat, null, 2));
    } catch (err) {
        console.error("Local DB error:", err.message);
    } finally {
        await mongoose.disconnect();
    }
    process.exit(0);
};

checkCategory();
