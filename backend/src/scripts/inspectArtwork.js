import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';

const inspectArtwork = async () => {
    try {
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        await mongoose.connect(dbUrl);
        
        const ProductTemplate = mongoose.model('ProductTemplate');
        const Category = mongoose.model('Category');

        console.log("=== CHECKING ART & DECOR TEMPLATES ===");
        const templates = await ProductTemplate.find({ name: /art/i }).lean();
        if (templates.length === 0) {
            console.log("No templates containing 'art' in name.");
        } else {
            templates.forEach(t => {
                console.log(`Template: [${t._id}] "${t.name}" | Status: ${t.status}`);
                console.log(`Steps:`, JSON.stringify(t.steps, null, 2));
            });
        }

        console.log("\n=== CHECKING CATEGORIES CONTAINING 'ART' OR 'DECOR' ===");
        const categories = await Category.find({ $or: [ { name: /art/i }, { slug: /art/i }, { name: /decor/i }, { slug: /decor/i } ] }).lean();
        if (categories.length === 0) {
            console.log("No categories matching.");
        } else {
            categories.forEach(c => {
                console.log(`Category: [${c._id}] "${c.name}" | Slug: "${c.slug}" | Parent: ${c.parentId} | Assigned Template: ${c.assignedTemplateId}`);
            });
        }

        console.log("\n=== CHECKING CATEGORIES WITH ASSIGNED TEMPLATE ===");
        const assignedCats = await Category.find({ assignedTemplateId: { $ne: null } }).lean();
        assignedCats.forEach(c => {
            console.log(`Category: [${c._id}] "${c.name}" | Assigned Template: ${c.assignedTemplateId}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

inspectArtwork();
