import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';

const seedCategories = async () => {
    try {
        console.log('Connecting to database...');
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        if (!dbUrl) {
            throw new Error('Database connection URL not set in environment');
        }
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB');

        const Category = mongoose.model('Category');

        const categoriesData = [
            { _id: "fashion", name: "Apparel", slug: "fashion", description: "Clothing and Apparel", parentId: null, order: 0, isActive: true },
            { _id: "2e70d5e5-ae8f-4c72-823c-8568f12877a8", name: "Turbans", slug: "turbans", description: "Traditional Sikh Turbans", parentId: null, order: 1, isActive: true },
            { _id: "7", name: "Musical Instruments", slug: "musical-instruments", description: "Kirtan instruments", parentId: null, order: 2, isActive: true },
            { _id: "books", name: "Books", slug: "books", description: "Religious and educational books", parentId: null, order: 3, isActive: true },
            { _id: "6", name: "Artwork", slug: "artwork", description: "Spiritual wall frames and carvings", parentId: null, order: 4, isActive: true },
            
            // Subcategories
            { _id: "patkas", name: "Patkas", slug: "patkas", description: "Comfortable patkas", parentId: "fashion", order: 0, isActive: true },
            { _id: "dastar-accessories", name: "Dastar accessories", slug: "dastar-accessories", description: "Pins and accessories", parentId: "fashion", order: 1, isActive: true },
            { _id: "sikh-inspired-clothing", name: "Sikh-inspired clothing", slug: "sikh-inspired-clothing", description: "Graphic tees and apparel", parentId: "fashion", order: 2, isActive: true },
            { _id: "hoodies", name: "Hoodies", slug: "hoodies", description: "Warm hoodies", parentId: "fashion", order: 3, isActive: true },
            { _id: "t-shirts", name: "T-shirts", slug: "t-shirts", description: "Casual t-shirts", parentId: "fashion", order: 4, isActive: true },
            { _id: "jackets", name: "Jackets", slug: "jackets", description: "Winter jackets", parentId: "fashion", order: 5, isActive: true },
            { _id: "scarves", name: "Scarves", slug: "scarves", description: "Beautiful scarves", parentId: "fashion", order: 6, isActive: true },
            { _id: "children's-clothing", name: "Children's clothing", slug: "childrens-clothing", description: "Kids wear", parentId: "fashion", order: 7, isActive: true },

            { _id: "1", name: "Nishan Sahib", slug: "nishan-sahib", description: "Sacred flags and accessories", parentId: null, order: 5, isActive: true },
            { _id: "nishan-flags", name: "Flags", slug: "nishan-flags", description: "Nishan Sahib flags", parentId: "1", order: 0, isActive: true },
            { _id: "nishan-poles", name: "Poles & Cholas", slug: "nishan-poles", description: "Poles and coverings", parentId: "1", order: 1, isActive: true },

            { _id: "3", name: "Accessories", slug: "accessories", description: "Turbans, dupattas, and more", parentId: null, order: 6, isActive: true },
            { _id: "jewelry", name: "Jewelry", slug: "jewelry", description: "Traditional jewelry", parentId: "3", order: 0, isActive: true },
            { _id: "watches", name: "Watches", slug: "watches", description: "Wrist watches", parentId: "3", order: 1, isActive: true },

            { _id: "4", name: "Kakaars", slug: "kakaars", description: "The 5 Ks of Sikhism", parentId: null, order: 7, isActive: true },
            { _id: "kara", name: "Kara", slug: "kara", description: "Iron bracelets", parentId: "4", order: 0, isActive: true },
            { _id: "kanga", name: "Kanga", slug: "kanga", description: "Wooden combs", parentId: "4", order: 1, isActive: true },
            { _id: "kirpan", name: "Kirpan", slug: "kirpan", description: "Ceremonial swords", parentId: "4", order: 2, isActive: true },

            { _id: "pens", name: "Pens & Pencils", slug: "pens-pencils", description: "Writing instruments", parentId: "books", order: 0, isActive: true },

            { _id: "8", name: "Kids & Family", slug: "kids-family", description: "Toys, games, and family items", parentId: null, order: 8, isActive: true },
            { _id: "9", name: "Digital Products", slug: "digital-products", description: "Audio, video, and e-books", parentId: null, order: 9, isActive: true },
            { _id: "10", name: "Gurudwara Items", slug: "gurudwara-items", description: "Essential items for Gurudwara", parentId: null, order: 10, isActive: true },
            { _id: "11", name: "Prakash & Sewa Items", slug: "prakash-sewa-items", description: "Items for Prakash and Sewa", parentId: null, order: 11, isActive: true },
            { _id: "12", name: "Langar Hall Supplies", slug: "langar-hall-supplies", description: "Utensils and supplies for Langar", parentId: null, order: 12, isActive: true }
        ];

        for (const cat of categoriesData) {
            const existingById = await Category.findOne({ _id: cat._id });
            const existingBySlug = await Category.findOne({ slug: cat.slug });
            if (existingById || existingBySlug) {
                console.log(`Skipping: ${cat.name} (already exists by ID or slug)`);
            } else {
                await Category.create(cat);
                console.log(`✅ Created category: ${cat.name}`);
            }
        }
        console.log('🎉 Categories seed finished successfully');
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

seedCategories();
