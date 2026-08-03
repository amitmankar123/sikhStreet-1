import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js'; // Ensure models are registered

const migrateCategories = async () => {
    try {
        console.log('Connecting to database...');
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        if (!dbUrl) {
            throw new Error('Database connection URL not set in environment');
        }
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB');

        const Category = mongoose.model('Category');

        console.log('Migrating categories...');
        const result = await Category.updateMany(
            { 
                $or: [
                    { assignedTemplateId: { $exists: false } },
                    { additionalFields: { $exists: false } }
                ]
            },
            { 
                $set: { 
                    assignedTemplateId: null, 
                    additionalFields: [] 
                } 
            }
        );
        
        console.log(`✅ Normalized ${result.modifiedCount} categories out of ${result.matchedCount} matched.`);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

migrateCategories();
