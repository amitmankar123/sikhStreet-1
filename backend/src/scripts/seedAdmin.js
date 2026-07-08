import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
    try {
        console.log('Connecting to database...');
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        if (!dbUrl) {
            throw new Error('Database connection URL not set in environment');
        }
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB');

        const Admin = mongoose.model('Admin');

        const email = 'admin@admin.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 12);

        const existing = await Admin.findOne({ email });

        if (existing) {
            existing.password = hashedPassword;
            existing.name = 'Super Admin';
            existing.role = 'superadmin';
            existing.isActive = true;
            await existing.save();
            console.log('✅ Admin credentials updated: admin@admin.com / admin123');
        } else {
            await Admin.create({
                name: 'Super Admin',
                email: email,
                password: hashedPassword,
                role: 'superadmin',
                isActive: true,
            });
            console.log('✅ Admin created: admin@admin.com / admin123');
        }
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

seedAdmin();
