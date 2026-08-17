import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';

const inspectTemplates = async () => {
    try {
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        await mongoose.connect(dbUrl);
        
        const ProductTemplate = mongoose.model('ProductTemplate');
        const Category = mongoose.model('Category');

        const templates = await ProductTemplate.find({}).lean();
        console.log("=== PRODUCT TEMPLATES ===");
        templates.forEach(t => {
            console.log(`- [${t._id}] Name: "${t.name}" | Status: ${t.status} | Steps Count: ${t.steps?.length || 0}`);
        });

        const categories = await Category.find({}).lean();
        console.log("\n=== ALL CATEGORIES IN DB ===");
        categories.forEach(c => {
            console.log(`- [${c._id}] Name: "${c.name}" | Slug: "${c.slug}" | Parent: ${c.parentId} | Assigned Template ID: ${c.assignedTemplateId}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

inspectTemplates();
