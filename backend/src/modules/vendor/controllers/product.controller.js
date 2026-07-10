import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { slugify } from '../../../utils/slugify.js';

const deriveStockStatus = (stockQuantity = 0, lowStockThreshold = 10) => {
    if (stockQuantity <= 0) return 'out_of_stock';
    if (stockQuantity <= lowStockThreshold) return 'low_stock';
    return 'in_stock';
};

const sanitizeFaqs = (faqs) => {
    if (!Array.isArray(faqs)) return [];
    return faqs
        .map((faq) => ({
            question: String(faq?.question || '').trim(),
            answer: String(faq?.answer || '').trim(),
        }))
        .filter((faq) => faq.question && faq.answer);
};

const normalizeVariantPart = (value) => String(value || '').trim().toLowerCase();

const uniqueAxisValues = (values = []) => {
    const seen = new Set();
    const out = [];
    for (const raw of values) {
        const value = String(raw || '').trim();
        if (!value) continue;
        const key = normalizeVariantPart(value);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(value);
    }
    return out;
};

const createVariantKey = (size = '', color = '') =>
    `${normalizeVariantPart(size)}|${normalizeVariantPart(color)}`;
const normalizeAxisName = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
const createDynamicVariantKey = (selection = {}) =>
    Object.entries(selection || {})
        .map(([axis, value]) => [normalizeAxisName(axis), normalizeVariantPart(value)])
        .filter(([axis, value]) => axis && value)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([axis, value]) => `${axis}=${value}`)
        .join('|');

const toObjectEntries = (value) => {
    if (!value) return [];
    if (typeof value === 'object') return Object.entries(value);
    return [];
};

const toNonNegativeNumber = (raw) => {
    if (raw === undefined || raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const normalizeAttributes = (rawAttributes = []) => {
    const seen = new Set();
    const attributes = [];
    for (const raw of rawAttributes || []) {
        const name = String(raw?.name || '').trim();
        const axisKey = normalizeAxisName(name);
        if (!name || !axisKey || seen.has(axisKey)) continue;
        seen.add(axisKey);
        const values = uniqueAxisValues(raw?.values || []);
        if (!values.length) continue;
        attributes.push({ name, axisKey, values });
    }
    return attributes;
};

const buildCombinationsFromAttributes = (attributes = []) => {
    if (!attributes.length) return [];
    let combos = [{}];
    attributes.forEach((attr) => {
        const next = [];
        combos.forEach((selection) => {
            attr.values.forEach((value) => next.push({ ...selection, [attr.axisKey]: value }));
        });
        combos = next;
    });
    return combos;
};

const normalizeVariantsPayload = (rawVariants = {}, fallbackPrice) => {
    if (!rawVariants || typeof rawVariants !== 'object') {
        return { sizes: [], colors: [], attributes: [], prices: {}, stockMap: {}, imageMap: {}, defaultVariant: {}, defaultSelection: {} };
    }

    const sizes = uniqueAxisValues(rawVariants.sizes || []);
    const colors = uniqueAxisValues(rawVariants.colors || []);
    const attributes = normalizeAttributes(rawVariants.attributes || []);
    const rawPrices = rawVariants.prices || {};
    const rawStockMap = rawVariants.stockMap || {};
    const rawImageMap = rawVariants.imageMap || {};
    const rawSkuMap = rawVariants.skuMap || {};
    const defaultVariant = rawVariants.defaultVariant || {};
    const defaultSelection = rawVariants.defaultSelection || {};

    const prices = {};
    const stockMap = {};
    const imageMap = {};
    const skuMap = {};

    const generatedCombos = buildCombinationsFromAttributes(attributes);
    if (generatedCombos.length > 0) {
        generatedCombos.forEach((combo) => {
            const key = createDynamicVariantKey(combo);
            if (!key) return;

            const priceVal = toNonNegativeNumber(rawPrices[key]);
            prices[key] = priceVal !== null ? priceVal : fallbackPrice;

            const stockVal = toNonNegativeNumber(rawStockMap[key]);
            stockMap[key] = stockVal !== null ? stockVal : 0;

            const imgVal = String(rawImageMap[key] || '').trim();
            if (imgVal) imageMap[key] = imgVal;

            const skuVal = String(rawSkuMap[key] || '').trim();
            if (skuVal) skuMap[key] = skuVal;
        });
    } else if (sizes.length > 0 || colors.length > 0) {
        const activeSizes = sizes.length > 0 ? sizes : [''];
        const activeColors = colors.length > 0 ? colors : [''];

        activeSizes.forEach((size) => {
            activeColors.forEach((color) => {
                const key = createVariantKey(size, color);
                const priceVal = toNonNegativeNumber(rawPrices[key]);
                prices[key] = priceVal !== null ? priceVal : fallbackPrice;

                const stockVal = toNonNegativeNumber(rawStockMap[key]);
                stockMap[key] = stockVal !== null ? stockVal : 0;

                const imgVal = String(rawImageMap[key] || '').trim();
                if (imgVal) imageMap[key] = imgVal;

                const skuVal = String(rawSkuMap[key] || '').trim();
                if (skuVal) skuMap[key] = skuVal;
            });
        });
    }

    return {
        sizes,
        colors,
        attributes,
        prices,
        stockMap,
        imageMap,
        skuMap,
        defaultVariant,
        defaultSelection,
    };
};

const calculateVariantAggregateStock = (variants) => {
    if (!variants || !variants.stockMap || typeof variants.stockMap !== 'object') {
        return null;
    }
    const entries = toObjectEntries(variants.stockMap);
    if (!entries.length) return null;

    return entries.reduce((sum, [, value]) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 ? sum + parsed : sum;
    }, 0);
};

// GET /api/vendor/products
export const getVendorProducts = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Category = mongoose.model('Category');
    const Brand = mongoose.model('Brand');

    const { page = 1, limit = 20, search, stock } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 20);
    const skip = (numericPage - 1) * numericLimit;
    const filter = { vendorId: req.user.id };

    if (search) {
        filter.$or = [
            { name: { $regex: String(search).trim(), $options: 'i' } },
            { description: { $regex: String(search).trim(), $options: 'i' } }
        ];
    }
    if (stock) filter.stock = stock;

    const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean();

    const catIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];
    const brandIds = [...new Set(products.map(p => p.brandId).filter(Boolean))];

    const [categories, brands] = await Promise.all([
        Category.find({ _id: { $in: catIds } }).select('name').lean(),
        Brand.find({ _id: { $in: brandIds } }).select('name').lean()
    ]);

    const formattedProducts = products.map((p) => {
        const copy = { ...p, id: p._id };
        const cat = categories.find(c => String(c._id) === String(p.categoryId));
        const brd = brands.find(b => String(b._id) === String(p.brandId));

        copy.categoryId = cat ? { id: p.categoryId, name: cat.name } : null;
        copy.brandId = brd ? { id: p.brandId, name: brd.name } : null;
        return copy;
    });

    const total = await Product.countDocuments(filter);
    res.status(200).json(new ApiResponse(200, { products: formattedProducts, total, page: numericPage, pages: Math.ceil(total / numericLimit) }, 'Products fetched.'));
});

// GET /api/vendor/products/:id
export const getVendorProductById = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Category = mongoose.model('Category');
    const Brand = mongoose.model('Brand');

    const product = await Product.findOne({ _id: req.params.id, vendorId: req.user.id }).lean();
    if (!product) throw new ApiError(404, 'Product not found or access denied.');

    const [category, brand] = await Promise.all([
        product.categoryId ? Category.findOne({ _id: product.categoryId }).select('name parentId').lean() : null,
        product.brandId ? Brand.findOne({ _id: product.brandId }).select('name').lean() : null
    ]);

    const copy = { ...product, id: product._id };
    copy.categoryId = category ? { id: product.categoryId, name: category.name, parentId: category.parentId } : null;
    copy.brandId = brand ? { id: product.brandId, name: brand.name } : null;

    res.status(200).json(new ApiResponse(200, copy, 'Product fetched.'));
});

// POST /api/vendor/products
export const createProduct = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const { name, ...rest } = req.body;
    if (!name) throw new ApiError(400, 'Product name is required.');
    const slug = slugify(name) + '-' + Date.now();
    
    // Generate a unique SKU: VND-1234-TIMESTAMP-RND
    const vendorPrefix = (req.user?.id || 'VND').substring(0, 4).toUpperCase();
    const timestampStr = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `VND-${vendorPrefix}-${timestampStr}-${randomStr}`;

    const isDigital = rest.productType === 'digital';
    const stockQuantity = isDigital ? 999999 : Number(rest.stockQuantity ?? 0);
    const lowStockThreshold = isDigital ? 0 : Number(rest.lowStockThreshold ?? 10);
    
    if (!isDigital && (!Number.isFinite(stockQuantity) || stockQuantity < 0)) {
        throw new ApiError(400, 'Invalid stock quantity.');
    }
    if (!isDigital && (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0)) {
        throw new ApiError(400, 'Invalid low stock threshold.');
    }
    
    const price = Number(rest.price);
    if (!Number.isFinite(price) || price < 0) {
        throw new ApiError(400, 'Invalid product price.');
    }

    const normalizedVariants = isDigital ? undefined : normalizeVariantsPayload(rest.variants, price);
    const variantAggregateStock = isDigital ? null : calculateVariantAggregateStock(normalizedVariants);
    const finalStockQuantity = Number.isFinite(variantAggregateStock) && variantAggregateStock !== null
        ? variantAggregateStock
        : stockQuantity;
    const stock = isDigital ? 'in_stock' : deriveStockStatus(finalStockQuantity, lowStockThreshold);

    const product = await Product.create({
        name,
        sku,
        slug,
        vendorId: req.user.id,
        price,
        description: rest.description || null,
        originalPrice: toNonNegativeNumber(rest.originalPrice),
        unit: isDigital ? 'Download' : (rest.unit || undefined),
        images: rest.images || null,
        image: rest.image || null,
        video: rest.video || null,
        categoryId: rest.categoryId,
        brandId: rest.brandId || null,
        totalAllowedQuantity: toNonNegativeNumber(rest.totalAllowedQuantity),
        minimumOrderQuantity: isDigital ? 1 : (toNonNegativeNumber(rest.minimumOrderQuantity) || undefined),
        lowStockThreshold,
        stockQuantity: finalStockQuantity,
        stock,
        variants: normalizedVariants || undefined,
        faqs: sanitizeFaqs(rest.faqs),
        flashSale: rest.flashSale !== undefined ? Boolean(rest.flashSale) : undefined,
        isNewArrival: rest.isNewArrival !== undefined ? Boolean(rest.isNewArrival) : undefined,
        isFeatured: rest.isFeatured !== undefined ? Boolean(rest.isFeatured) : undefined,
        isActive: rest.isActive !== undefined ? Boolean(rest.isActive) : undefined,
        isVisible: rest.isVisible !== undefined ? Boolean(rest.isVisible) : undefined,
        codAllowed: isDigital ? false : (rest.codAllowed !== undefined ? Boolean(rest.codAllowed) : undefined),
        returnable: isDigital ? false : (rest.returnable !== undefined ? Boolean(rest.returnable) : undefined),
        cancelable: isDigital ? false : (rest.cancelable !== undefined ? Boolean(rest.cancelable) : undefined),
        taxIncluded: rest.taxIncluded !== undefined ? Boolean(rest.taxIncluded) : undefined,
        warrantyPeriod: isDigital ? null : (rest.warrantyPeriod || null),
        guaranteePeriod: isDigital ? null : (rest.guaranteePeriod || null),
        hsnCode: rest.hsnCode || null,
        taxRate: toNonNegativeNumber(rest.taxRate) || undefined,
        seoTitle: rest.seoTitle || null,
        seoDescription: rest.seoDescription || null,
        relatedProducts: rest.relatedProducts || null,
        tags: rest.tags || null,
        specifications: isDigital ? null : (rest.specifications || null),
        turbanConfig: isDigital ? null : (rest.turbanConfig || null),
        productType: rest.productType || 'physical',
        digitalConfig: isDigital ? rest.digitalConfig : null,
    });

    res.status(201).json(new ApiResponse(201, product, 'Product created.'));
});

// PUT /api/vendor/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const body = req.body;
    const updates = {};
    const existing = await Product.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!existing) throw new ApiError(404, 'Product not found or access denied.');

    const existingType = existing.productType || 'physical';
    if (body.productType && body.productType !== existingType) {
        throw new ApiError(400, 'Changing product type of an existing product is not allowed.');
    }

    const fields = [
        'name', 'description', 'originalPrice', 'unit', 'images', 'image', 'video',
        'categoryId', 'brandId', 'totalAllowedQuantity', 'minimumOrderQuantity',
        'flashSale', 'isNewArrival', 'isFeatured', 'isActive', 'isVisible',
        'codAllowed', 'returnable', 'cancelable', 'taxIncluded', 'warrantyPeriod',
        'guaranteePeriod', 'hsnCode', 'taxRate', 'seoTitle', 'seoDescription',
        'relatedProducts', 'tags', 'specifications', 'turbanConfig', 'productType', 'digitalConfig'
    ];

    fields.forEach(field => {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    });

    const isDigital = (body.productType || existing.productType) === 'digital';

    if (body.name) {
        updates.slug = slugify(body.name) + '-' + Date.now();
    }

    if (body.faqs !== undefined) {
        updates.faqs = sanitizeFaqs(body.faqs);
    }

    let price = existing.price;
    if (body.price !== undefined) {
        price = Number(body.price);
        if (!Number.isFinite(price) || price < 0) {
            throw new ApiError(400, 'Invalid product price.');
        }
        updates.price = price;
    }

    let variants = existing.variants;
    if (!isDigital && body.variants !== undefined) {
        variants = normalizeVariantsPayload(body.variants, price);
        updates.variants = variants;
    }

    let stockQuantity = isDigital ? 999999 : existing.stockQuantity;
    if (!isDigital && body.stockQuantity !== undefined) {
        stockQuantity = Number(body.stockQuantity);
        if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
            throw new ApiError(400, 'Invalid stock quantity.');
        }
        updates.stockQuantity = stockQuantity;
    }

    let lowStockThreshold = isDigital ? 0 : existing.lowStockThreshold;
    if (!isDigital && body.lowStockThreshold !== undefined) {
        lowStockThreshold = Number(body.lowStockThreshold);
        if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
            throw new ApiError(400, 'Invalid low stock threshold.');
        }
        updates.lowStockThreshold = lowStockThreshold;
    }

    if (!isDigital && body.variants !== undefined) {
        const variantAggregateStock = calculateVariantAggregateStock(variants);
        if (Number.isFinite(variantAggregateStock)) {
            stockQuantity = variantAggregateStock;
            updates.stockQuantity = stockQuantity;
        }
    }

    if (isDigital) {
        updates.stockQuantity = 999999;
        updates.stock = 'in_stock';
        updates.lowStockThreshold = 0;
        updates.variants = undefined;
        updates.turbanConfig = null;
        updates.specifications = null;
        updates.codAllowed = false;
        updates.returnable = false;
        updates.cancelable = false;
        updates.unit = 'Download';
        updates.minimumOrderQuantity = 1;
    } else {
        updates.stock = deriveStockStatus(stockQuantity, lowStockThreshold);
    }

    const updated = await Product.findOneAndUpdate(
        { _id: existing._id },
        { $set: updates },
        { new: true }
    );

    res.status(200).json(new ApiResponse(200, updated, 'Product updated.'));
});

// DELETE /api/vendor/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const existing = await Product.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!existing) throw new ApiError(404, 'Product not found or access denied.');

    await Product.deleteOne({ _id: req.params.id });

    res.status(200).json(new ApiResponse(200, null, 'Product deleted.'));
});

// PATCH /api/vendor/stock/:productId
export const updateStock = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const { stockQuantity } = req.body;
    const existing = await Product.findOne({ _id: req.params.productId, vendorId: req.user.id });
    if (!existing) throw new ApiError(404, 'Product not found.');

    const numericStockQuantity = Number(stockQuantity);
    if (
        !Number.isFinite(numericStockQuantity) ||
        numericStockQuantity < 0 ||
        !Number.isInteger(numericStockQuantity)
    ) {
        throw new ApiError(400, 'Invalid stock quantity.');
    }

    const updated = await Product.findOneAndUpdate(
        { _id: existing._id },
        {
            $set: {
                stockQuantity: numericStockQuantity,
                stock: deriveStockStatus(numericStockQuantity, existing.lowStockThreshold),
            }
        },
        { new: true }
    );

    res.status(200).json(new ApiResponse(200, updated, 'Stock updated.'));
});
