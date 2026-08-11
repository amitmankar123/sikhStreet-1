import { Router } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { calculateVendorShippingForGroups } from '../services/vendorShipping.service.js';
import { applyCampaignDiscountsToProducts } from '../utils/campaignPriceResolver.js';

const router = Router();

const toPublicVendor = (vendorDoc) => {
    const vendor = vendorDoc || {};
    return {
        ...vendor,
        id: vendor._id || vendor.id,
        totalProducts: vendor._count?.products || 0,
        password: undefined,
        otp: undefined,
        otpExpiry: undefined,
        bankDetails: undefined,
        commissionRate: undefined,
        _count: undefined,
    };
};

const normalizeVariantPart = (value) => String(value || '').trim().toLowerCase();
const normalizeVariantKey = (key) => String(key || '').trim().toLowerCase();

const toVariantPriceEntries = (variantPrices) => {
    if (!variantPrices) return [];
    if (variantPrices instanceof Map) return Array.from(variantPrices.entries());
    if (typeof variantPrices === 'object') return Object.entries(variantPrices);
    return [];
};

const resolveVariantPrice = (product, selectedVariant) => {
    const basePrice = Number(product?.price);
    if (!Number.isFinite(basePrice) || basePrice < 0) return 0;

    const selectionEntries = Object.entries(selectedVariant || {})
        .map(([axis, value]) => [String(axis || '').trim(), String(value || '').trim()])
        .filter(([axis, value]) => axis && value);

    const dynamicKey = selectionEntries.length
        ? selectionEntries
            .map(([axis, value]) => `${normalizeVariantPart(axis)}=${normalizeVariantPart(value)}`)
            .sort()
            .join('|')
        : '';

    const size = normalizeVariantPart(selectedVariant?.size);
    const color = normalizeVariantPart(selectedVariant?.color);
    const entries = toVariantPriceEntries(product?.variants?.prices);
    if (!entries.length || (!dynamicKey && !size && !color)) return basePrice;

    const candidateKeys = [
        dynamicKey || null,
        `${size}|${color}`,
        `${size}-${color}`,
        `${size}_${color}`,
        `${size}:${color}`,
        size && !color ? size : null,
        color && !size ? color : null,
    ].filter(Boolean);

    for (const candidate of candidateKeys) {
        if (!candidate) continue;
        const exact = entries.find(([rawKey]) => String(rawKey).trim() === candidate);
        if (exact) {
            const price = Number(exact[1]);
            if (Number.isFinite(price) && price >= 0) return price;
        }

        const normalized = entries.find(
            ([rawKey]) => normalizeVariantKey(rawKey) === normalizeVariantKey(candidate)
        );
        if (normalized) {
            const price = Number(normalized[1]);
            if (Number.isFinite(price) && price >= 0) return price;
        }
    }

    return basePrice;
};

// Helper to compile Mongoose filter from query params
const buildMongooseProductFilter = async (queryFilters) => {
    const filter = { isActive: true };
    const Category = mongoose.model('Category');
    const Vendor = mongoose.model('Vendor');

    // Exclude suspended vendors
    const suspendedVendors = await Vendor.find({ status: 'suspended' }).select('_id').lean();
    const suspendedIds = suspendedVendors.map(v => String(v._id));
    filter.vendorId = { $nin: suspendedIds };

    if (queryFilters.category) {
        const rawCategory = String(queryFilters.category).trim();

        // Match categories by _id, slug, or name (case-insensitive)
        const matchedCategories = await Category.find({
            $or: [
                { _id: rawCategory },
                { slug: rawCategory },
                { name: { $regex: `^${rawCategory}$`, $options: 'i' } }
            ]
        }).select('_id slug').lean();

        const rootIds = matchedCategories.map(c => String(c._id));
        const rootSlugs = matchedCategories.map(c => c.slug).filter(Boolean);

        // Find child categories whose parentId matches rootId or rootSlug
        const childCategories = await Category.find({
            $or: [
                { parentId: { $in: [...rootIds, ...rootSlugs, rawCategory] } }
            ]
        }).select('_id slug').lean();

        const allCategoryKeys = [
            ...rootIds,
            ...rootSlugs,
            rawCategory,
            ...childCategories.map(c => String(c._id)),
            ...childCategories.map(c => c.slug).filter(Boolean)
        ];

        // Alias fashion/apparel keywords
        if (['fashion', 'apparel', 'apperal', 't-shirts', 'jackets', 'scarves', 'hoodies'].includes(rawCategory.toLowerCase())) {
            const fashionCats = await Category.find({
                $or: [
                    { slug: { $in: ['fashion', 'apparel', 'apperal', 't-shirts', 'jackets', 'scarves', 'hoodies'] } },
                    { name: { $regex: 'fashion|apparel|apperal', $options: 'i' } }
                ]
            }).select('_id slug').lean();
            fashionCats.forEach(c => {
                allCategoryKeys.push(String(c._id));
                if (c.slug) allCategoryKeys.push(c.slug);
            });
            allCategoryKeys.push('fashion', 'apparel', 'apperal', 't-shirts', 'jackets', 'scarves', 'hoodies');
        }

        filter.categoryId = { $in: [...new Set(allCategoryKeys)] };
    }


    if (queryFilters.brand) filter.brandId = queryFilters.brand;
    if (queryFilters.vendor) {
        if (suspendedIds.includes(String(queryFilters.vendor))) {
            filter.vendorId = 'none-nonexistent';
        } else {
            filter.vendorId = queryFilters.vendor;
        }
    }

    if (queryFilters.flashSale === 'true') filter.flashSale = true;
    if (queryFilters.isNewArrival === 'true') filter.isNewArrival = true;

    if (queryFilters.minPrice || queryFilters.maxPrice) {
        filter.price = {};
        if (queryFilters.minPrice) filter.price.$gte = Number(queryFilters.minPrice);
        if (queryFilters.maxPrice) filter.price.$lte = Number(queryFilters.maxPrice);
    }

    if (queryFilters.minRating) {
        filter.rating = { $gte: Number(queryFilters.minRating) };
    }

    const searchQuery = String(queryFilters.search || queryFilters.q || '').trim();
    if (searchQuery) {
        filter.$or = [
            { name: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
        ];
    }

    return filter;
};

// Helper to batch-populate category, brand, and vendor details for products
const populateProductsListRelations = async (products) => {
    if (!Array.isArray(products) || products.length === 0) return [];
    
    const Category = mongoose.model('Category');
    const Brand = mongoose.model('Brand');
    const Vendor = mongoose.model('Vendor');

    const catIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];
    const brandIds = [...new Set(products.map(p => p.brandId).filter(Boolean))];
    const vendorIds = [...new Set(products.map(p => p.vendorId).filter(Boolean))];

    const [categories, brands, vendors] = await Promise.all([
        Category.find({ _id: { $in: catIds } }).select('name').lean(),
        Brand.find({ _id: { $in: brandIds } }).select('name').lean(),
        Vendor.find({ _id: { $in: vendorIds } }).select('storeName').lean()
    ]);

    const populated = products.map(p => {
        const mapped = { ...p, id: p._id };
        const cat = categories.find(c => String(c._id) === String(p.categoryId));
        const brd = brands.find(b => String(b._id) === String(p.brandId));
        const vnd = vendors.find(v => String(v._id) === String(p.vendorId));

        mapped.categoryId = cat ? { _id: p.categoryId, id: p.categoryId, name: cat.name } : null;
        mapped.brandId = brd ? { _id: p.brandId, id: p.brandId, name: brd.name } : null;
        mapped.vendorId = vnd ? { _id: p.vendorId, id: p.vendorId, storeName: vnd.storeName } : null;

        return mapped;
    });

    return applyCampaignDiscountsToProducts(populated);
};

// GET /api/products — list with filters
const listProducts = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const {
        page = 1,
        limit = 12,
        sort = 'newest',
    } = req.query;

    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 12);
    const skip = (numericPage - 1) * numericLimit;

    const filter = await buildMongooseProductFilter(req.query);

    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        popular: { reviewCount: -1 },
        rating: { rating: -1 }
    };

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort(sortMap[sort] || { createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter)
    ]);

    const mappedProducts = await populateProductsListRelations(products);

    res.status(200).json(new ApiResponse(200, {
        products: mappedProducts,
        total,
        page: numericPage,
        pages: Math.ceil(total / numericLimit)
    }, 'Products fetched.'));
});

router.get('/', listProducts);
router.get('/products', listProducts);

// GET /api/products/flash-sale
router.get('/flash-sale', asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Vendor = mongoose.model('Vendor');

    const suspendedVendors = await Vendor.find({ status: 'suspended' }).select('_id').lean();
    const suspendedIds = suspendedVendors.map(v => String(v._id));

    const products = await Product.find({
        isActive: true,
        flashSale: true,
        vendorId: { $nin: suspendedIds }
    })
    .limit(20)
    .lean();

    const mappedProducts = products.map(p => ({ ...p, id: p._id }));

    res.status(200).json(new ApiResponse(200, mappedProducts, 'Flash sale products.'));
}));

// GET /api/products/new-arrivals
router.get('/new-arrivals', asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const {
        page = 1,
        limit = 20,
        sort = 'newest',
    } = req.query;

    const numericPage = Math.max(Number(page) || 1, 1);
    const numericLimit = Math.max(Number(limit) || 20, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = await buildMongooseProductFilter(req.query);
    filter.isNewArrival = true;

    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        popular: { reviewCount: -1 },
        rating: { rating: -1 },
    };

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort(sortMap[sort] || { createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    const mappedProducts = await populateProductsListRelations(products);

    res.status(200).json(new ApiResponse(200, {
        products: mappedProducts,
        total,
        page: numericPage,
        pages: Math.ceil(total / numericLimit),
    }, 'New arrivals fetched.'));
}));

// GET /api/products/popular
router.get('/popular', asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Vendor = mongoose.model('Vendor');

    const suspendedVendors = await Vendor.find({ status: 'suspended' }).select('_id').lean();
    const suspendedIds = suspendedVendors.map(v => String(v._id));

    const products = await Product.find({
        isActive: true,
        vendorId: { $nin: suspendedIds }
    })
    .sort({ reviewCount: -1, rating: -1 })
    .limit(10)
    .lean();

    const mappedProducts = products.map(p => ({ ...p, id: p._id }));

    res.status(200).json(new ApiResponse(200, mappedProducts, 'Popular products.'));
}));

// GET /api/products/similar/:id
router.get('/similar/:id', asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Vendor = mongoose.model('Vendor');

    const isUuidOrMongo = /^[a-fA-F0-9]{24}$/.test(req.params.id) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(req.params.id);
    if (!isUuidOrMongo) return res.status(200).json(new ApiResponse(200, [], 'Invalid ID.'));

    const product = await Product.findOne({ _id: req.params.id }).lean();
    if (!product) throw new ApiError(404, 'Product not found.');

    const vendor = await Vendor.findOne({ _id: product.vendorId }).lean();
    if (!vendor || vendor.status === 'suspended') throw new ApiError(404, 'Product not found.');

    const suspendedVendors = await Vendor.find({ status: 'suspended' }).select('_id').lean();
    const suspendedIds = suspendedVendors.map(v => String(v._id));

    const similar = await Product.find({
        isActive: true,
        _id: { $ne: product._id },
        categoryId: product.categoryId,
        vendorId: { $nin: suspendedIds }
    })
    .limit(6)
    .lean();

    const mappedSimilar = similar.map(p => ({ ...p, id: p._id }));

    res.status(200).json(new ApiResponse(200, mappedSimilar, 'Similar products.'));
}));

const getProductDetail = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Category = mongoose.model('Category');
    const Brand = mongoose.model('Brand');
    const Vendor = mongoose.model('Vendor');

    const product = await Product.findOne({ _id: req.params.id }).lean();
    if (!product || !product.isActive) {
        throw new ApiError(404, 'Product not found.');
    }

    const vendor = await Vendor.findOne({ _id: product.vendorId }).select('storeName storeLogo rating status').lean();
    if (!vendor || vendor.status === 'suspended') {
        throw new ApiError(404, 'Product not found.');
    }

    const [category, brand] = await Promise.all([
        product.categoryId ? Category.findOne({ _id: product.categoryId }).select('name').lean() : null,
        product.brandId ? Brand.findOne({ _id: product.brandId }).select('name').lean() : null
    ]);

    const mapped = { ...product, id: product._id };
    mapped.categoryId = category ? { _id: product.categoryId, id: product.categoryId, name: category.name } : null;
    mapped.brandId = brand ? { _id: product.brandId, id: product.brandId, name: brand.name } : null;
    mapped.vendorId = { 
        _id: product.vendorId, 
        id: product.vendorId, 
        storeName: vendor.storeName || vendor.name, 
        storeLogo: vendor.storeLogo, 
        rating: vendor.rating 
    };

    const discounted = await applyCampaignDiscountsToProducts([mapped]);
    res.status(200).json(new ApiResponse(200, discounted[0], 'Product detail.'));
});

// GET /api/products/:productId/questions  (public — must be before /:id)
router.get('/products/:productId/questions', asyncHandler(async (req, res) => {
    const ProductQuestion = mongoose.model('ProductQuestion');
    const { productId } = req.params;

    const questions = await ProductQuestion.find({ productId })
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json(new ApiResponse(200, questions, 'Questions fetched.'));
}));

// GET /api/products/:id
router.get('/products/:id', getProductDetail);

// GET /api/categories (public)
router.get('/categories/all', asyncHandler(async (req, res) => {
    const Category = mongoose.model('Category');
    const categories = await Category.find({ isActive: true })
        .sort({ order: 1 })
        .lean();
    res.status(200).json(new ApiResponse(200, categories, 'Categories fetched.'));
}));

// GET /api/brands (public)
router.get('/brands/all', asyncHandler(async (req, res) => {
    const Brand = mongoose.model('Brand');
    const brands = await Brand.find({ isActive: true })
        .sort({ name: 1 })
        .lean();
    res.status(200).json(new ApiResponse(200, brands, 'Brands fetched.'));
}));

// GET /api/vendors/all (public)
router.get('/vendors/all', asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    const Product = mongoose.model('Product');

    const { page = 1, limit = 50, search } = req.query;
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.max(parseInt(limit, 10) || 50, 1);
    const skip = (numericPage - 1) * numericLimit;
    
    const filter = { status: { $ne: 'suspended' } };

    const trimmedSearch = String(search || '').trim();
    if (trimmedSearch) {
        filter.$or = [
            { name: { $regex: trimmedSearch, $options: 'i' } },
            { email: { $regex: trimmedSearch, $options: 'i' } },
            { storeName: { $regex: trimmedSearch, $options: 'i' } }
        ];
    }

    const [vendors, total] = await Promise.all([
        Vendor.find(filter)
            .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Vendor.countDocuments(filter)
    ]);

    // Aggregate product count for each vendor in a single query
    const activeProductsCount = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$vendorId", count: { $sum: 1 } } }
    ]);

    const mappedVendors = vendors.map(v => {
        const match = activeProductsCount.find(c => String(c._id) === String(v._id));
        return toPublicVendor({
            ...v,
            _count: { products: match ? match.count : 0 }
        });
    });

    res.status(200).json(new ApiResponse(200, {
        vendors: mappedVendors,
        total,
        page: numericPage,
        pages: Math.ceil(total / numericLimit)
    }, 'Vendors fetched.'));
}));

// GET /api/vendors/:id (public)
router.get('/vendors/:id', asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    const Product = mongoose.model('Product');

    const vendor = await Vendor.findOne({
        _id: req.params.id,
        status: { $ne: 'suspended' }
    }).lean();
    
    if (!vendor) throw new ApiError(404, 'Vendor not found.');

    const activeProductCount = await Product.countDocuments({
        vendorId: req.params.id,
        isActive: true
    });

    const vendorWithCount = {
        ...vendor,
        _count: { products: activeProductCount }
    };

    res.status(200).json(new ApiResponse(200, toPublicVendor(vendorWithCount), 'Vendor detail fetched.'));
}));

// GET /api/vendors/:id/products (public)
router.get('/vendors/:id/products', asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    const Product = mongoose.model('Product');

    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (numericPage - 1) * numericLimit;

    const vendor = await Vendor.findOne({
        _id: req.params.id,
        status: { $ne: 'suspended' },
    }).select('_id').lean();
    
    if (!vendor) throw new ApiError(404, 'Vendor not found.');

    const filter = {
        isActive: true,
        vendorId: req.params.id
    };

    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        popular: { reviewCount: -1 },
        rating: { rating: -1 },
    };

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort(sortMap[sort] || { createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter)
    ]);

    const mappedProducts = await populateProductsListRelations(products);

    res.status(200).json(new ApiResponse(200, {
        products: mappedProducts,
        total,
        page: numericPage,
        pages: Math.ceil(total / numericLimit)
    }, 'Vendor products fetched.'));
}));

// POST /api/coupons/validate
router.post('/coupons/validate', asyncHandler(async (req, res) => {
    const Coupon = mongoose.model('Coupon');
    const rawCode = String(req.body?.code || '').trim();
    const cartTotal = Number(req.body?.cartTotal);

    if (!rawCode) {
        throw new ApiError(400, 'Coupon code is required.');
    }
    if (!Number.isFinite(cartTotal) || cartTotal < 0) {
        throw new ApiError(400, 'Cart total must be a valid non-negative number.');
    }

    const coupon = await Coupon.findOne({ code: rawCode.toUpperCase() }).lean();
    if (!coupon || !coupon.isActive) throw new ApiError(400, 'Invalid coupon code.');
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) throw new ApiError(400, 'Coupon is not active yet.');
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new ApiError(400, 'Coupon has expired.');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached.');
    if (cartTotal < coupon.minOrderValue) throw new ApiError(400, `Minimum order value for this coupon is Rs.${coupon.minOrderValue}.`);

    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = (cartTotal * coupon.value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
    }

    discount = Math.min(cartTotal, discount);

    res.status(200).json(new ApiResponse(200, { coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount }, 'Coupon is valid.'));
}));

// GET /api/coupons/available
router.get('/coupons/available', asyncHandler(async (req, res) => {
    const Coupon = mongoose.model('Coupon');
    const now = new Date();
    
    const filter = {
        isActive: true,
        $and: [
            { $or: [ { startsAt: null }, { startsAt: { $lte: now } } ] },
            { $or: [ { expiresAt: null }, { expiresAt: { $gte: now } } ] }
        ]
    };

    const coupons = await Coupon.find(filter)
        .select('code name type value minOrderValue maxDiscount expiresAt usageLimit usedCount')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    const activeCoupons = coupons
        .filter(coupon => {
            if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
                return false;
            }
            return true;
        })
        .slice(0, 30);

    res.status(200).json(new ApiResponse(200, activeCoupons, 'Available coupons fetched.'));
}));

// POST /api/shipping/estimate
router.post('/shipping/estimate', asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Vendor = mongoose.model('Vendor');

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const shippingAddress = req.body?.shippingAddress || {};
    const shippingOption = String(req.body?.shippingOption || 'standard');
    const couponType = req.body?.couponType || null;

    if (!items.length) {
        return res.status(200).json(
            new ApiResponse(200, { shipping: 0, byVendor: {} }, 'Shipping estimate calculated.')
        );
    }

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const productIds = items
        .map((item) => String(item?.productId || '').trim())
        .filter((id) => isUuid.test(id) || /^[a-fA-F0-9]{24}$/.test(id));
    if (!productIds.length) {
        return res.status(200).json(
            new ApiResponse(200, { shipping: 0, byVendor: {} }, 'Shipping estimate calculated.')
        );
    }

    const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
    }).lean();

    const vendorIds = [...new Set(products.map(p => p.vendorId).filter(Boolean))];
    const vendors = await Vendor.find({
        _id: { $in: vendorIds },
        status: { $ne: 'suspended' }
    }).select('_id shippingEnabled defaultShippingRate freeShippingThreshold').lean();

    // Map vendor object back to products list
    products.forEach(p => {
        const matchingVendor = vendors.find(v => String(v._id) === String(p.vendorId));
        if (matchingVendor) {
            p.vendor = {
                id: matchingVendor._id,
                shippingEnabled: matchingVendor.shippingEnabled,
                defaultShippingRate: matchingVendor.defaultShippingRate,
                freeShippingThreshold: matchingVendor.freeShippingThreshold
            };
        }
    });

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const vendorMap = {};

    items.forEach((item) => {
        const product = productMap.get(String(item?.productId || ''));
        if (!product || !product.vendor) return;

        const vendorId = String(product.vendor.id);
        const quantity = Math.max(1, Number(item?.quantity || 1));
        const price = Math.max(0, Number(resolveVariantPrice(product, item?.variant) || 0));
        const subtotal = price * quantity;

        if (!vendorMap[vendorId]) {
            vendorMap[vendorId] = {
                vendorId,
                subtotal: 0,
                shippingEnabled: product.vendor.shippingEnabled !== false,
                defaultShippingRate: product.vendor.defaultShippingRate,
                freeShippingThreshold: product.vendor.freeShippingThreshold,
            };
        }
        vendorMap[vendorId].subtotal += subtotal;
    });

    const { totalShipping, shippingByVendor } = await calculateVendorShippingForGroups({
        vendorGroups: Object.values(vendorMap),
        shippingAddress,
        shippingOption,
        couponType,
    });

    res.status(200).json(
        new ApiResponse(200, { shipping: totalShipping, byVendor: shippingByVendor }, 'Shipping estimate calculated.')
    );
}));

// GET /api/banners
router.get('/banners', asyncHandler(async (req, res) => {
    const Banner = mongoose.model('Banner');
    const Campaign = mongoose.model('Campaign');
    const { type } = req.query;
    const now = new Date();
    
    const filter = {
        isActive: true,
        $and: [
            { $or: [ { startDate: null }, { startDate: { $lte: now } } ] },
            { $or: [ { endDate: null }, { endDate: { $gte: now } } ] }
        ]
    };
    if (type) filter.type = type;

    const banners = await Banner.find(filter)
        .sort({ order: 1 })
        .lean();

    // Filter out banners linked to campaigns that have no products
    const filteredBanners = [];
    for (const banner of banners) {
        if (banner.type === 'promotional' && banner.link) {
            const parts = banner.link.split('/');
            const slug = parts[parts.length - 1];
            if (slug) {
                const campaign = await Campaign.findOne({ slug }).lean();
                if (!campaign || !Array.isArray(campaign.productIds) || campaign.productIds.length === 0) {
                    continue;
                }
            }
        }
        filteredBanners.push(banner);
    }

    res.status(200).json(new ApiResponse(200, filteredBanners, 'Banners fetched.'));
}));

// GET /api/campaigns
router.get('/campaigns', asyncHandler(async (req, res) => {
    const Campaign = mongoose.model('Campaign');
    const { type, limit = 20 } = req.query;
    const parsedLimit = Math.max(parseInt(limit, 10) || 20, 1);
    const now = new Date();

    const filter = {
        isActive: true,
        $and: [
            { $or: [ { startDate: null }, { startDate: { $lte: now } } ] },
            { $or: [ { endDate: null }, { endDate: { $gte: now } } ] }
        ]
    };
    if (type) filter.type = type;

    const campaigns = await Campaign.find(filter)
        .select('name slug type route discountType discountValue startDate endDate bannerConfig categoryId productIds')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean();

    const mappedCampaigns = campaigns
        .filter(c => Array.isArray(c.productIds) && c.productIds.length > 0)
        .map(c => ({ ...c, id: c._id }));

    res.status(200).json(new ApiResponse(200, mappedCampaigns, 'Campaigns fetched.'));
}));

// GET /api/campaigns/:slug
router.get('/campaigns/:slug', asyncHandler(async (req, res) => {
    const Campaign = mongoose.model('Campaign');
    const Product = mongoose.model('Product');

    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) throw new ApiError(400, 'Campaign slug is required.');

    const campaign = await Campaign.findOne({ slug }).lean();
    if (!campaign || !campaign.isActive) throw new ApiError(404, 'Campaign not found.');

    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
        throw new ApiError(404, 'Campaign is not active yet.');
    }
    if (campaign.endDate && new Date(campaign.endDate) < now) {
        throw new ApiError(404, 'Campaign has ended.');
    }

    const productIds = Array.isArray(campaign.productIds)
        ? campaign.productIds.map(v => String(v).trim())
        : [];

    const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
    }).lean();

    const mappedProducts = await populateProductsListRelations(products);

    const payload = {
        ...campaign,
        id: campaign._id,
        products: mappedProducts,
    };

    res.status(200).json(new ApiResponse(200, payload, 'Campaign fetched.'));
}));

// GET /api/orders/track/:id (public order tracking)
router.get('/orders/track/:id', asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const order = await Order.findOne({ orderId: req.params.id })
        .select('orderId status trackingNumber estimatedDelivery deliveredAt createdAt updatedAt cancelledAt')
        .lean();
    
    if (!order) throw new ApiError(404, 'Order not found.');
    res.status(200).json(new ApiResponse(200, { ...order, id: order._id }, 'Order tracking info.'));
}));

// Legacy support: GET /api/:id (supports both UUIDs and legacy 24-char ObjectId hexes)
router.get('/:id([0-9a-fA-F-]{24,36})', getProductDetail);

// Geo-Commerce: Nearby Discovery (Street View Mode)
router.get('/discovery/nearby', asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    const Product = mongoose.model('Product');

    const { lat, lng, radius = 50, limit = 20 } = req.query;

    if (!lat || !lng) {
        throw new ApiError(400, 'Latitude and longitude are required.');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInMeters = parseFloat(radius) * 1000;

    const rawNearbyVendors = await Vendor.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [longitude, latitude] },
                distanceField: "distance_meters",
                maxDistance: radiusInMeters,
                spherical: true,
                query: { status: { $ne: "suspended" } }
            }
        },
        {
            $limit: parseInt(limit)
        },
        {
            $project: {
                _id: 1,
                name: 1,
                storeName: 1,
                storeLogo: 1,
                rating: 1,
                reviewCount: 1,
                distance_meters: 1
            }
        }
    ]);

    const nearbyVendors = rawNearbyVendors.map(v => {
        const id = v._id ? String(v._id) : v.id;
        return {
            id,
            name: v.name,
            storeName: v.storeName,
            storeLogo: v.storeLogo,
            rating: v.rating,
            reviewCount: v.reviewCount,
            distance_meters: v.distance_meters
        };
    });

    const vendorIds = nearbyVendors.map(v => v.id);
    let products = [];

    if (vendorIds.length > 0) {
        const rawProducts = await Product.find({
            vendorId: { $in: vendorIds },
            isActive: true
        }).lean();

        products = await populateProductsListRelations(rawProducts);
    }

    res.status(200).json(new ApiResponse(200, {
        vendors: nearbyVendors,
        products
    }, 'Nearby discovery fetched successfully.'));
}));

export default router;
