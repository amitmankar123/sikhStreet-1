import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';

const seedBookFilters = async () => {
    try {
        console.log('Connecting to database...');
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        if (!dbUrl) {
            throw new Error('Database connection URL not set in environment');
        }
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB');

        const AdditionalField = mongoose.model('AdditionalField');
        const Category = mongoose.model('Category');

        // Check if Books category exists
        const booksCategory = await Category.findOne({ _id: 'books' });
        if (!booksCategory) {
            console.error('❌ Books category not found! Please run seedCategories.js first.');
            process.exit(1);
        }

        const filtersData = [
            {
                name: 'book_language',
                label: 'Language',
                type: 'multi_select',
                options: [
                    'English',
                    'Punjabi (Gurmukhi)',
                    'Punjabi (Shahmukhi)',
                    'Hindi',
                    'Urdu',
                    'Persian',
                    'Spanish',
                    'French',
                    'Other Languages'
                ],
                displayOrder: 1
            },
            {
                name: 'book_format',
                label: 'Format',
                type: 'dropdown',
                options: ['Hardcover', 'Paperback', 'eBook'],
                displayOrder: 2
            },
            {
                name: 'book_condition',
                label: 'Condition',
                type: 'dropdown',
                options: ['New', 'Used'],
                displayOrder: 3
            },
            {
                name: 'book_age_group',
                label: 'Age Group',
                type: 'multi_select',
                options: ['0–5 Years', '6–10 Years', '11–15 Years', 'Young Adults', 'Adults'],
                displayOrder: 4
            },
            {
                name: 'book_availability_region',
                label: 'Availability Region',
                type: 'multi_select',
                options: ['India', 'Canada', 'UK', 'USA', 'Australia', 'Worldwide Shipping'],
                displayOrder: 5
            },
            {
                name: 'book_purchase_options',
                label: 'Purchase Options',
                type: 'dropdown',
                options: ['Print on Demand', 'Ready to Ship'],
                displayOrder: 6
            },
            {
                name: 'book_spiritual_state',
                label: 'Spiritual State',
                type: 'multi_select',
                options: [
                    'New to Sikhi',
                    'Curious & Exploring',
                    'Learning Gurbani',
                    'Daily Nitnem',
                    'Seeking Inner Peace',
                    'Building Discipline',
                    'Understanding Sikh History',
                    'Deepening Spiritual Knowledge',
                    'Family & Parenting',
                    'Youth Guidance',
                    'Leadership & Seva',
                    'Meditation & Simran',
                    'Life Challenges',
                    'Grief & Loss',
                    'Inspiration & Motivation',
                    'New to Spirituality'
                ],
                displayOrder: 7
            },
            {
                name: 'book_themes',
                label: 'Themes',
                type: 'multi_select',
                options: [
                    'Seva',
                    'Simran',
                    'Courage',
                    'Sacrifice',
                    'Leadership',
                    'Equality',
                    'Justice',
                    'Compassion',
                    'Family',
                    'Parenting',
                    'Women in Sikh History',
                    'Martial Tradition',
                    'Philosophy',
                    'Spirituality',
                    'Rehatnama'
                ],
                displayOrder: 8
            },
            {
                name: 'book_guru_sahiban',
                label: 'Guru Sahiban',
                type: 'multi_select',
                options: [
                    'Guru Nanak Dev Ji',
                    'Guru Angad Dev Ji',
                    'Guru Amar Das Ji',
                    'Guru Ram Das Ji',
                    'Guru Arjan Dev Ji',
                    'Guru Hargobind Sahib Ji',
                    'Guru Har Rai Ji',
                    'Guru Har Krishan Ji',
                    'Guru Tegh Bahadur Ji',
                    'Guru Gobind Singh Ji'
                ],
                displayOrder: 9
            },
            {
                name: 'book_bhagats',
                label: 'Bhagats',
                type: 'multi_select',
                options: [
                    'Bhagat Kabir Ji',
                    'Bhagat Ravidas Ji',
                    'Bhagat Namdev Ji',
                    'Bhagat Farid Ji',
                    'Bhagat Trilochan Ji',
                    'Bhagat Dhanna Ji',
                    'Bhagat Beni Ji',
                    'Bhagat Jaidev Ji',
                    'View All Bhagats'
                ],
                displayOrder: 10
            },
            {
                name: 'book_warriors',
                label: 'Sikh Warriors',
                type: 'multi_select',
                options: [
                    'Baba Banda Singh Bahadur',
                    'Bhai Gurdas Ji',
                    'Bhai Nand Lal Ji',
                    'Baba Deep Singh Ji',
                    'Mai Bhago Ji',
                    'Jassa Singh Ahluwalia',
                    'Maharaja Ranjit Singh',
                    'Contemporary Sikh Leaders',
                    'Char Sahibzade',
                    'Panj Payare'
                ],
                displayOrder: 11
            },
            {
                name: 'book_sikh_history_period',
                label: 'Sikh History',
                type: 'multi_select',
                options: [
                    'Guru Period',
                    'Misl Period',
                    'Sikh Empire',
                    'British India',
                    'Partition',
                    'Modern Sikh History'
                ],
                displayOrder: 12
            },
            {
                name: 'book_women_in_history',
                label: 'Women in Sikh History',
                type: 'multi_select',
                options: [
                    'Mata Khivi Ji',
                    'Bibi Bhani Ji',
                    'Mata Gujri Ji',
                    'Mata Sahib Kaur Ji',
                    'Mata Sundari Ji',
                    'Mai Bhago Ji',
                    'Bibi Harsharan Kaur Ji',
                    'Sikh Women Freedom Fighters',
                    'Contemporary Sikh Women'
                ],
                displayOrder: 13
            },
            {
                name: 'book_author',
                label: 'Author',
                type: 'text',
                options: [],
                displayOrder: 14
            },
            {
                name: 'book_publisher',
                label: 'Publisher',
                type: 'text',
                options: [],
                displayOrder: 15
            }
        ];

        console.log('Upserting Additional Fields in the library...');
        const additionalFieldsList = [];

        for (const filter of filtersData) {
            let field = await AdditionalField.findOne({ name: filter.name });
            if (field) {
                field.label = filter.label;
                field.type = filter.type;
                field.options = filter.options;
                field.displayOrder = filter.displayOrder;
                await field.save();
                console.log(`Updated existing field: ${filter.label}`);
            } else {
                field = await AdditionalField.create(filter);
                console.log(`Created new field: ${filter.label}`);
            }
            additionalFieldsList.push({
                _id: field._id,
                name: field.name,
                label: field.label,
                type: field.type,
                options: field.options,
                required: false,
                displayOrder: field.displayOrder
            });
        }

        // Assign these fields to the Books category
        booksCategory.additionalFields = additionalFieldsList;
        await booksCategory.save();
        console.log('✅ Successfully assigned fields to the Books and Literature category!');

    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Database disconnected.');
    }
};

seedBookFilters();
