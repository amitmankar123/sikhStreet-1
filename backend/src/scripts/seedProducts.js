import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import '../../src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const slugify = (text) => {
    return String(text || '')
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
};

const loadStaticVendors = () => {
    const vendorsFilePath = path.join(__dirname, '../../../frontend/src/data/vendors.js');
    let content = fs.readFileSync(vendorsFilePath, 'utf8');
    content = content.replace(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g, (match, varName, importPath) => {
        return `const ${varName} = "${importPath.replace(/^\.\.\/\.\./, '')}";`;
    });
    content = content.replace(/\bexport\s+/g, '');
    content = content.replace(/\bconst\s+vendors\s*=/, 'return');
    const vendorsList = new Function(content)();
    return vendorsList;
};

const loadStaticProducts = () => {
    const productsFilePath = path.join(__dirname, '../../../frontend/src/data/products.js');
    let content = fs.readFileSync(productsFilePath, 'utf8');
    content = content.replace(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g, (match, varName, importPath) => {
        return `const ${varName} = "${importPath.replace(/^\.\.\/\.\./, '')}";`;
    });
    content = content.replace(/\bexport\s+/g, '');
    content = content.replace(/\bconst\s+products\s*=/, 'return');
    const productsList = new Function(content)();
    return productsList;
};

const seedCatalog = async () => {
    try {
        console.log('Connecting to database...');
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        if (!dbUrl) {
            throw new Error('Database connection URL not set in environment');
        }
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB');

        const Vendor = mongoose.model('Vendor');
        const Product = mongoose.model('Product');

        console.log('Seeding vendors...');
        const staticVendors = loadStaticVendors();
        for (const v of staticVendors) {
            const email = v.email || `${slugify(v.storeName || v.name)}@example.com`;
            const existing = await Vendor.findOne({ $or: [{ _id: String(v.id) }, { email }] });
            const hashedPassword = await bcrypt.hash('vendor123', 12);

            const payload = {
                name: v.name || v.storeName,
                email,
                phone: v.phone || '+1234567890',
                storeName: v.storeName || v.name,
                storeDescription: v.storeDescription || '',
                status: 'approved',
                isVerified: true,
                commissionRate: v.commissionRate || 10,
                governmentIdDocumentUrl: '',
            };

            if (existing) {
                if (String(existing._id) !== String(v.id)) {
                    await Vendor.deleteOne({ _id: existing._id });
                    await Vendor.create({
                        _id: String(v.id),
                        password: hashedPassword,
                        ...payload
                    });
                    console.log(`✅ Seeded Vendor (Re-created due to ID change): ${payload.storeName}`);
                } else {
                    Object.assign(existing, payload);
                    await existing.save();
                    console.log(`✅ Seeded Vendor (Updated): ${payload.storeName}`);
                }
            } else {
                await Vendor.create({
                    _id: String(v.id),
                    password: hashedPassword,
                    ...payload
                });
                console.log(`✅ Seeded Vendor (Created): ${payload.storeName}`);
            }
        }

        console.log('Seeding products...');
        const staticProducts = loadStaticProducts();
        for (const p of staticProducts) {
            const id = String(p.id);
            const name = p.name;
            const slug = p.slug || (slugify(name) + '-' + id);
            const sku = p.sku || `SKU-${id.toUpperCase()}`;

            const existing = await Product.findOne({ $or: [{ _id: id }, { slug }, { sku }] });

            const payload = {
                name,
                slug,
                sku,
                description: p.description || name,
                price: Number(p.price || 0),
                originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
                unit: p.unit || 'Piece',
                image: p.image || '',
                images: p.images || [p.image || ''],
                video: p.video || '',
                categoryId: p.categoryId ? String(p.categoryId) : undefined,
                brandId: p.brandId ? String(p.brandId) : undefined,
                vendorId: p.vendorId ? String(p.vendorId) : '1',
                stock: p.stock || 'in_stock',
                stockQuantity: p.stockQuantity !== undefined ? Number(p.stockQuantity) : 100,
                rating: p.rating !== undefined ? Number(p.rating) : 0,
                reviewCount: p.reviewCount !== undefined ? Number(p.reviewCount) : 0,
                variants: p.variants || {},
                flashSale: !!p.flashSale,
                isNewArrival: !!p.isNewArrival,
                isFeatured: !!p.isFeatured,
                codAllowed: p.codAllowed !== false,
                returnable: p.returnable !== false,
                cancelable: p.cancelable !== false,
                taxIncluded: !!p.taxIncluded,
                productType: p.productType || 'physical',
                digitalConfig: p.digitalConfig || {},
                faqs: p.faqs || [],
                tags: p.tags || [],
            };

            if (p.bookConfig) {
                payload.specifications = p.bookConfig;
            }

            if (existing) {
                if (String(existing._id) !== id) {
                    await Product.deleteOne({ _id: existing._id });
                    await Product.create({
                        _id: id,
                        ...payload
                    });
                    console.log(`✅ Seeded Product (Re-created due to ID change): ${name}`);
                } else {
                    Object.assign(existing, payload);
                    await existing.save();
                    console.log(`✅ Seeded Product (Updated): ${name}`);
                }
            } else {
                await Product.create({
                    _id: id,
                    ...payload
                });
                console.log(`✅ Seeded Product (Created): ${name}`);
            }
        }

        console.log('🎉 Catalog seeding finished successfully');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

seedCatalog();
