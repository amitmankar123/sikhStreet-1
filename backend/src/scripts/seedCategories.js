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
            { _id: "books", name: "Books and Literature", slug: "books", description: "Religious and educational books", parentId: null, order: 3, isActive: true },
            { _id: "6", name: "Artwork", slug: "artwork", description: "Spiritual wall frames and carvings", parentId: null, order: 4, isActive: true },
            
            // Subcategories under fashion
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

            // Level 2 Subcategories under books (aligned with design image)
            { _id: "sikh-history-books", name: "Sikh History", slug: "sikh-history-books", description: "Sikh history and educational books", parentId: "books", order: 0, isActive: true },
            { _id: "childrens-books", name: "Children's Books", slug: "childrens-books", description: "Sikhism and Gurmat books for children", parentId: "books", order: 1, isActive: true },
            { _id: "punjabi-literature", name: "Punjabi Literature", slug: "punjabi-literature", description: "Classic and contemporary Punjabi literature", parentId: "books", order: 2, isActive: true },
            { _id: "biographies-sikh-personalities", name: "Biographies", slug: "biographies-sikh-personalities", description: "Biographies of Gurus and Sikh warriors", parentId: "books", order: 3, isActive: true },
            { _id: "language-learning-books", name: "Language & Learning", slug: "language-learning-books", description: "Learn Punjabi and Gurmukhi scripts", parentId: "books", order: 4, isActive: true },
            { _id: "journals-notebooks", name: "Academic & Research", slug: "journals-notebooks", description: "Journals, academic research, and notebooks", parentId: "books", order: 5, isActive: true },
            { _id: "punjab", name: "Punjab & Politics", slug: "punjab", description: "Books about Punjab state, history, politics and culture", parentId: "books", order: 6, isActive: true },
            { _id: "e-books", name: "Digital & E-books", slug: "e-books", description: "E-books and digital reading materials", parentId: "books", order: 7, isActive: true },

            // Obsolete / Merged Level 2 Categories (Deactivated)
            { _id: "poetry-collections", name: "Poetry Collections", slug: "poetry-collections", parentId: "books", order: 8, isActive: false },
            { _id: "comics-graphic-novels", name: "Comics and Graphic Novels", slug: "comics-graphic-novels", parentId: "books", order: 9, isActive: false },
            { _id: "politics", name: "Politics", slug: "politics", parentId: "books", order: 10, isActive: false },
            { _id: "skill-building", name: "Skill Building", slug: "skill-building", parentId: "books", order: 11, isActive: false },

            // Level 3 Topics under sikh-history-books
            { _id: "gurus-topic", name: "Gurus", slug: "gurus", parentId: "sikh-history-books", group: "Sikhism", order: 0, isActive: true },
            { _id: "gurbani-studies-topic", name: "Gurbani Studies", slug: "gurbani-studies", parentId: "sikh-history-books", group: "Sikhism", order: 1, isActive: true },
            { _id: "sikh-philosophy-topic", name: "Sikh Philosophy", slug: "sikh-philosophy", parentId: "sikh-history-books", group: "Sikhism", order: 2, isActive: true },
            { _id: "sikh-practices-topic", name: "Sikh Practices", slug: "sikh-practices", parentId: "sikh-history-books", group: "Sikhism", order: 3, isActive: true },
            { _id: "sikh-rehat-topic", name: "Sikh Rehat", slug: "sikh-rehat", parentId: "sikh-history-books", group: "Sikhism", order: 4, isActive: true },
            { _id: "sikh-theology-topic", name: "Sikh Theology", slug: "sikh-theology", parentId: "sikh-history-books", group: "Sikhism", order: 5, isActive: true },
            { _id: "sikh-symbols-topic", name: "Sikh Symbols", slug: "sikh-symbols", parentId: "sikh-history-books", group: "Sikhism", order: 6, isActive: true },
            { _id: "sikh-history-general-topic", name: "Sikh History", slug: "sikh-history-general", parentId: "sikh-history-books", group: "History", order: 7, isActive: true },
            { _id: "punjab-history-topic", name: "Punjab History", slug: "punjab-history", parentId: "sikh-history-books", group: "History", order: 8, isActive: true },
            { _id: "partition-topic", name: "Partition", slug: "partition", parentId: "sikh-history-books", group: "History", order: 9, isActive: true },
            { _id: "sikh-empire-topic", name: "Sikh Empire", slug: "sikh-empire", parentId: "sikh-history-books", group: "History", order: 10, isActive: true },
            { _id: "freedom-movement-topic", name: "Freedom Movement", slug: "freedom-movement", parentId: "sikh-history-books", group: "History", order: 11, isActive: true },
            { _id: "military-history-topic", name: "Military History", slug: "military-history", parentId: "sikh-history-books", group: "History", order: 12, isActive: true },
            
            // Level 3 Topics under childrens-books
            { _id: "picture-books-topic", name: "Picture Books", slug: "picture-books", parentId: "childrens-books", group: "Children & Young Readers", order: 0, isActive: true },
            { _id: "early-readers-topic", name: "Early Readers", slug: "early-readers", parentId: "childrens-books", group: "Children & Young Readers", order: 1, isActive: true },
            { _id: "activity-books-topic", name: "Activity Books", slug: "activity-books", parentId: "childrens-books", group: "Children & Young Readers", order: 2, isActive: true },
            { _id: "educational-books-topic", name: "Educational Books", slug: "educational-books", parentId: "childrens-books", group: "Children & Young Readers", order: 3, isActive: true },
            { _id: "bedtime-stories-topic", name: "Bedtime Stories", slug: "bedtime-stories", parentId: "childrens-books", group: "Children & Young Readers", order: 4, isActive: true },
            { _id: "sikh-values-topic", name: "Sikh Values", slug: "sikh-values", parentId: "childrens-books", group: "Children & Young Readers", order: 5, isActive: true },
            { _id: "comics-topic", name: "Comics", slug: "comics", parentId: "childrens-books", group: "Children & Young Readers", order: 6, isActive: true },
            { _id: "historical-comics-topic", name: "Historical Comics", slug: "historical-comics", parentId: "childrens-books", group: "Children & Young Readers", order: 7, isActive: true },
            { _id: "graphic-novels-topic", name: "Graphic Novels", slug: "graphic-novels", parentId: "childrens-books", group: "Children & Young Readers", order: 8, isActive: true },
            
            // Level 3 Topics under punjabi-literature
            { _id: "fiction-topic", name: "Fiction", slug: "fiction", parentId: "punjabi-literature", group: "Punjabi Literature", order: 0, isActive: true },
            { _id: "short-stories-topic", name: "Short Stories", slug: "short-stories", parentId: "punjabi-literature", group: "Punjabi Literature", order: 1, isActive: true },
            { _id: "poetry-topic", name: "Poetry", slug: "poetry", parentId: "punjabi-literature", group: "Punjabi Literature", order: 2, isActive: true },
            { _id: "classic-lit-topic", name: "Classic Literature", slug: "classic-literature", parentId: "punjabi-literature", group: "Punjabi Literature", order: 3, isActive: true },
            { _id: "contemporary-lit-topic", name: "Contemporary Literature", slug: "contemporary-literature", parentId: "punjabi-literature", group: "Punjabi Literature", order: 4, isActive: true },
            
            // Level 3 Topics under biographies-sikh-personalities
            { _id: "biography-gurus-topic", name: "Gurus", slug: "biography-gurus", parentId: "biographies-sikh-personalities", group: "Biographies", order: 0, isActive: true },
            { _id: "sikh-warriors-topic", name: "Sikh Warriors", slug: "sikh-warriors", parentId: "biographies-sikh-personalities", group: "Biographies", order: 1, isActive: true },
            { _id: "saints-topic", name: "Saints", slug: "saints", parentId: "biographies-sikh-personalities", group: "Biographies", order: 2, isActive: true },
            { _id: "scholars-topic", name: "Scholars", slug: "scholars", parentId: "biographies-sikh-personalities", group: "Biographies", order: 3, isActive: true },
            { _id: "modern-personalities-topic", name: "Modern Sikh Personalities", slug: "modern-personalities", parentId: "biographies-sikh-personalities", group: "Biographies", order: 4, isActive: true },

            // Level 3 Topics under language-learning-books
            { _id: "punjabi-lang-topic", name: "Punjabi", slug: "punjabi-lang", parentId: "language-learning-books", group: "Language & Learning", order: 0, isActive: true },
            { _id: "gurmukhi-lang-topic", name: "Gurmukhi", slug: "gurmukhi-lang", parentId: "language-learning-books", group: "Language & Learning", order: 1, isActive: true },
            { _id: "shahmukhi-lang-topic", name: "Shahmukhi", slug: "shahmukhi-lang", parentId: "language-learning-books", group: "Language & Learning", order: 2, isActive: true },
            { _id: "dictionaries-lang-topic", name: "Dictionaries", slug: "dictionaries-lang", parentId: "language-learning-books", group: "Language & Learning", order: 3, isActive: true },
            { _id: "grammar-lang-topic", name: "Grammar", slug: "grammar-lang", parentId: "language-learning-books", group: "Language & Learning", order: 4, isActive: true },
            { _id: "workbooks-lang-topic", name: "Workbooks", slug: "workbooks-lang", parentId: "language-learning-books", group: "Language & Learning", order: 5, isActive: true },
            { _id: "persian-lang-topic", name: "Persian", slug: "persian-lang", parentId: "language-learning-books", group: "Language & Learning", order: 6, isActive: true },
            { _id: "urdu-lang-topic", name: "Urdu", slug: "urdu-lang", parentId: "language-learning-books", group: "Language & Learning", order: 7, isActive: true },
            { _id: "sanskrit-lang-topic", name: "Sanskrit", slug: "sanskrit-lang", parentId: "language-learning-books", group: "Language & Learning", order: 8, isActive: true },

            // Level 3 Topics under journals-notebooks (Academic & Research)
            { _id: "research-papers-topic", name: "Research Papers", slug: "research-papers", parentId: "journals-notebooks", group: "Academic & Research", order: 0, isActive: true },
            { _id: "journals-topic", name: "Journals", slug: "journals", parentId: "journals-notebooks", group: "Academic & Research", order: 1, isActive: true },
            { _id: "reference-books-acad-topic", name: "Reference Books", slug: "reference-books-acad", parentId: "journals-notebooks", group: "Academic & Research", order: 2, isActive: true },
            { _id: "encyclopedias-topic", name: "Encyclopedias", slug: "encyclopedias", parentId: "journals-notebooks", group: "Academic & Research", order: 3, isActive: true },
            { _id: "university-texts-topic", name: "University Texts", slug: "university-texts", parentId: "journals-notebooks", group: "Academic & Research", order: 4, isActive: true },

            // Level 3 Topics under punjab (Punjab & Politics)
            { _id: "punjab-history-pol-topic", name: "Punjab History", slug: "punjab-history-pol", parentId: "punjab", group: "Punjab & Politics", order: 0, isActive: true },
            { _id: "sikh-identity-topic", name: "Sikh Identity", slug: "sikh-identity", parentId: "punjab", group: "Punjab & Politics", order: 1, isActive: true },
            { _id: "politics-pol-topic", name: "Politics", slug: "politics-pol", parentId: "punjab", group: "Punjab & Politics", order: 2, isActive: true },
            { _id: "human-rights-topic", name: "Human Rights", slug: "human-rights", parentId: "punjab", group: "Punjab & Politics", order: 3, isActive: true },
            { _id: "diaspora-topic", name: "Diaspora", slug: "diaspora", parentId: "punjab", group: "Punjab & Politics", order: 4, isActive: true },
            { _id: "gender-studies-topic", name: "Gender Studies", slug: "gender-studies", parentId: "punjab", group: "Punjab & Politics", order: 5, isActive: true },

            // Level 3 Topics under e-books (Digital & E-books)
            { _id: "fiction-ebook-topic", name: "Fiction", slug: "fiction-ebook", parentId: "e-books", group: "Digital & E-books", order: 0, isActive: true },
            { _id: "poetry-ebook-topic", name: "Poetry", slug: "poetry-ebook", parentId: "e-books", group: "Digital & E-books", order: 1, isActive: true },
            { _id: "sikh-history-ebook-topic", name: "Sikh History", slug: "sikh-history-ebook", parentId: "e-books", group: "Digital & E-books", order: 2, isActive: true },
            { _id: "punjabi-ebook-topic", name: "Punjabi", slug: "punjabi-ebook", parentId: "e-books", group: "Digital & E-books", order: 3, isActive: true },
            { _id: "reference-books-ebook-topic", name: "Reference Books", slug: "reference-books-ebook", parentId: "e-books", group: "Digital & E-books", order: 4, isActive: true },

            { _id: "8", name: "Kids & Family", slug: "kids-family", description: "Toys, games, and family items", parentId: null, order: 8, isActive: true },
            { _id: "9", name: "Digital Products", slug: "digital-products", description: "Audio, video, and e-books", parentId: null, order: 9, isActive: true },
            { _id: "10", name: "Gurudwara Items", slug: "gurudwara-items", description: "Essential items for Gurudwara", parentId: null, order: 10, isActive: true },
            { _id: "11", name: "Prakash & Sewa Items", slug: "prakash-sewa-items", description: "Items for Prakash and Sewa", parentId: null, order: 11, isActive: true },
            { _id: "12", name: "Langar Hall Supplies", slug: "langar-hall-supplies", description: "Utensils and supplies for Langar", parentId: null, order: 12, isActive: true }
        ];

        for (const cat of categoriesData) {
            let existing = await Category.findOne({ _id: cat._id });
            if (!existing) {
                existing = await Category.findOne({ slug: cat.slug });
            }
            if (existing) {
                existing.name = cat.name;
                existing.slug = cat.slug;
                existing.description = cat.description || existing.description;
                existing.parentId = cat.parentId;
                existing.order = cat.order !== undefined ? cat.order : existing.order;
                existing.isActive = cat.isActive !== undefined ? cat.isActive : existing.isActive;
                existing.group = cat.group || existing.group || "";
                await existing.save();
                console.log(`✅ Updated category: ${cat.name}`);
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
