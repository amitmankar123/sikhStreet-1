import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';

const assignTemplate = async () => {
    try {
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        await mongoose.connect(dbUrl);
        
        const ProductTemplate = mongoose.model('ProductTemplate');
        const Category = mongoose.model('Category');

        // 1. Publish the Art & Decors Template
        const template = await ProductTemplate.findById("art-and-decors-template-uuid-0001");
        if (template) {
            template.status = "published";
            await template.save();
            console.log("✅ Published Art & Decors Template (status set to published)");
        } else {
            console.error("❌ Art & Decors Template not found!");
        }

        // 2. Assign the template to the Artwork category (ID: "6")
        const category = await Category.findById("6");
        if (category) {
            category.assignedTemplateId = "art-and-decors-template-uuid-0001";
            await category.save();
            console.log("✅ Assigned Art & Decors Template to Category 'Artwork' (ID: '6')");
        } else {
            console.error("❌ Artwork category (ID: '6') not found!");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

assignTemplate();
