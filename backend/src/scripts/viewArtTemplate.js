import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';

const viewArtTemplate = async () => {
    try {
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        await mongoose.connect(dbUrl);
        
        const ProductTemplate = mongoose.model('ProductTemplate');
        const template = await ProductTemplate.findById("art-and-decors-template-uuid-0001").lean();
        console.log("=== FULL ART TEMPLATE ===");
        console.log(JSON.stringify(template, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

viewArtTemplate();
