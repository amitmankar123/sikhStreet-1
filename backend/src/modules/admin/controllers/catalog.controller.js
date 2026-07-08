import { runInTransaction } from '../../../utils/transaction.js';
import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { slugify } from '../../../utils/slugify.js';

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
    if (value instanceof Map) return Array.from(value.entries());
    if (typeof value === 'object') return Object.entries(value);
    return [];
};

const toNonNegativeNumber = (raw) => {
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
        return { sizes: [], colors: [], prices: {}, stockMap: {}, imageMap: {}, defaultVariant: {} };
    }

    const sizes = uniqueAxisValues(rawVariants.sizes || []);
    const colors = uniqueAxisValues(rawVariants.colors || []);
    const attributes = normalizeAttributes(rawVariants.attributes || []);
    const hasSizeAxis = sizes.length > 0;
    const hasColorAxis = colors.length > 0;
    const hasDynamicAxes = attributes.length > 0;
    const hasAnyAxis = hasDynamicAxes || hasSizeAxis || hasColorAxis;

    if (!hasAnyAxis) {
        return { sizes: [], colors: [], attributes: [], prices: {}, stockMap: {}, imageMap: {}, defaultVariant: {}, defaultSelection: {} };
    }

    const combinations = [];
    if (hasDynamicAxes) {
        buildCombinationsFromAttributes(attributes).forEach((selection) => combinations.push({ selection }));
    } else if (hasSizeAxis && hasColorAxis) {
        sizes.forEach((size) => colors.forEach((color) => combinations.push({ selection: { size, color } })));
    } else if (hasSizeAxis) {
        sizes.forEach((size) => combinations.push({ selection: { size } }));
    } else {
        colors.forEach((color) => combinations.push({ selection: { color } }));
    }

    const pricesSource = Object.fromEntries(toObjectEntries(rawVariants.prices));
    const stockSource = Object.fromEntries(toObjectEntries(rawVariants.stockMap));
    const imageSource = Object.fromEntries(toObjectEntries(rawVariants.imageMap));
    const prices = {};
    const stockMap = {};
    const imageMap = {};

    combinations.forEach(({ selection }) => {
        const size = String(selection?.size || '');
        const color = String(selection?.color || '');
        const key = hasDynamicAxes
            ? createDynamicVariantKey(selection)
            : createVariantKey(size, color);
        const parsedPrice = toNonNegativeNumber(pricesSource[key]);
        if (parsedPrice !== null) {
            prices[key] = parsedPrice;
        } else {
            const fallback = toNonNegativeNumber(fallbackPrice);
            if (fallback !== null) prices[key] = fallback;
        }

        const parsedStock = toNonNegativeNumber(stockSource[key]);
        if (parsedStock !== null) stockMap[key] = parsedStock;

        const image = String(imageSource[key] || '').trim();
        if (image) imageMap[key] = image;
    });

    const defaultSize = String(rawVariants?.defaultVariant?.size || '').trim();
    const defaultColor = String(rawVariants?.defaultVariant?.color || '').trim();
    const normalizedDefaultSize = hasSizeAxis ? defaultSize : '';
    const normalizedDefaultColor = hasColorAxis ? defaultColor : '';
    const hasValidDefaultSize = !normalizedDefaultSize || sizes.some((s) => normalizeVariantPart(s) === normalizeVariantPart(normalizedDefaultSize));
    const hasValidDefaultColor = !normalizedDefaultColor || colors.some((c) => normalizeVariantPart(c) === normalizeVariantPart(normalizedDefaultColor));
    if (!hasValidDefaultSize || !hasValidDefaultColor) {
        throw new ApiError(400, 'Default variant must exist in provided sizes/colors.');
    }

    const defaultSelection = {};
    if (rawVariants?.defaultSelection && typeof rawVariants.defaultSelection === 'object') {
        Object.entries(rawVariants.defaultSelection).forEach(([axis, value]) => {
            const axisKey = normalizeAxisName(axis);
            const selectedValue = String(value || '').trim();
            if (!axisKey || !selectedValue) return;
            const axisMeta = attributes.find((attr) => attr.axisKey === axisKey);
            if (!axisMeta) return;
            const matched = axisMeta.values.find(
                (candidate) => normalizeVariantPart(candidate) === normalizeVariantPart(selectedValue)
            );
            if (matched) defaultSelection[axisKey] = matched;
        });
    }

    return {
        sizes,
        colors,
        attributes: attributes.map((attr) => ({ name: attr.name, values: attr.values })),
        prices,
        stockMap,
        imageMap,
        defaultVariant: {
            size: normalizedDefaultSize,
            color: normalizedDefaultColor,
        },
        defaultSelection,
    };
};

const calculateVariantAggregateStock = (variants = {}) => {
    const entries = toObjectEntries(variants.stockMap);
    if (!entries.length) return null;
    return entries.reduce((sum, [, value]) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 ? sum + parsed : sum;
    }, 0);
};

const sanitizeCategoryPayload = (payload = {}) => {
    const allowed = ['name', 'description', 'image', 'icon', 'parentId', 'order', 'isActive'];
    const sanitized = {};
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            sanitized[key] = payload[key];
        }
    }
    if (Object.prototype.hasOwnProperty.call(sanitized, 'parentId')) {
        sanitized.parentId = sanitized.parentId || null;
    }
    return sanitized;
};

const assertValidCategoryParent = async ({ categoryId = null, parentId }) => {
    if (!parentId) return;

    if (categoryId && String(categoryId) === String(parentId)) {
        throw new ApiError(400, 'Category cannot be parent of itself.');
    }

    const Category = mongoose.model('Category');

    const parent = await Category.findOne({ _id: parentId }).select('_id parentId').lean();
    if (!parent) {
        throw new ApiError(400, 'Selected parent category does not exist.');
    }

    if (categoryId) {
        let cursor = parent;
        while (cursor?.parentId) {
            if (String(cursor.parentId) === String(categoryId)) {
                throw new ApiError(400, 'Invalid parent category hierarchy.');
            }
            cursor = await Category.findOne({ _id: cursor.parentId }).select('_id parentId').lean();
        }
    }
};

const sanitizeBrandPayload = (payload = {}) => {
    const allowed = ['name', 'logo', 'description', 'website', 'isActive'];
    const sanitized = {};
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            sanitized[key] = payload[key];
        }
    }
    return sanitized;
};

// GET /api/admin/products
export const getAllProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, vendorId, categoryId, status, includeInactive = 'false' } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const Product = mongoose.model('Product');
    const Category = mongoose.model('Category');
    const Brand = mongoose.model('Brand');
    const Vendor = mongoose.model('Vendor');

    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }
    if (vendorId) filter.vendorId = vendorId;
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.stock = status;
    if (String(includeInactive) !== 'true') {
        filter.isActive = true;
    }

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    const vendorIds = [...new Set(products.map(p => p.vendorId).filter(Boolean))];
    const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];
    const brandIds = [...new Set(products.map(p => p.brandId).filter(Boolean))];

    const [vendors, categories, brands] = await Promise.all([
        Vendor.find({ _id: { $in: vendorIds } }).select('storeName').lean(),
        Category.find({ _id: { $in: categoryIds } }).select('name').lean(),
        Brand.find({ _id: { $in: brandIds } }).select('name').lean()
    ]);

    const mappedProducts = products.map((p) => {
        const vendor = vendors.find(v => String(v._id) === String(p.vendorId));
        const category = categories.find(c => String(c._id) === String(p.categoryId));
        const brand = brands.find(b => String(b._id) === String(p.brandId));
        return {
            ...p,
            id: String(p._id),
            vendorId: vendor ? { _id: vendor._id, id: String(vendor._id), storeName: vendor.storeName } : null,
            categoryId: category ? { _id: category._id, id: String(category._id), name: category.name } : null,
            brandId: brand ? { _id: brand._id, id: String(brand._id), name: brand.name } : null
        };
    });

    res.status(200).json(new ApiResponse(200, { products: mappedProducts, total, page: numericPage, pages: Math.ceil(total / numericLimit) }, 'Products fetched.'));
});

// GET /api/admin/products/:id
export const getProductById = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Category = mongoose.model('Category');
    const Brand = mongoose.model('Brand');
    const Vendor = mongoose.model('Vendor');

    const p = await Product.findOne({ _id: req.params.id }).lean();

    if (!p) throw new ApiError(404, 'Product not found.');

    const [vendor, category, brand] = await Promise.all([
        p.vendorId ? Vendor.findOne({ _id: p.vendorId }).select('storeName').lean() : null,
        p.categoryId ? Category.findOne({ _id: p.categoryId }).select('name').lean() : null,
        p.brandId ? Brand.findOne({ _id: p.brandId }).select('name').lean() : null
    ]);

    const mapped = {
        ...p,
        id: String(p._id),
        vendorId: vendor ? { _id: vendor._id, id: String(vendor._id), storeName: vendor.storeName } : null,
        categoryId: category ? { _id: category._id, id: String(category._id), name: category.name } : null,
        brandId: brand ? { _id: brand._id, id: String(brand._id), name: brand.name } : null
    };

    res.status(200).json(new ApiResponse(200, mapped, 'Product fetched.'));
});

// POST /api/admin/products
export const createProduct = asyncHandler(async (req, res) => {
    const { name, stockQuantity = 0, stock, categoryId, brandId, vendorId, ...rest } = req.body;
    const slug = slugify(name) + '-' + Date.now();
    
    const adminPrefix = (req.user?.id || 'ADM').substring(0, 4).toUpperCase();
    const timestampStr = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `ADM-${adminPrefix}-${timestampStr}-${randomStr}`;

    const normalizedVariants = normalizeVariantsPayload(rest.variants, rest.price);

    const numericStockQuantity = Number(stockQuantity) || 0;
    const variantAggregateStock = calculateVariantAggregateStock(normalizedVariants);
    const finalStockQuantity = Number.isFinite(variantAggregateStock)
        ? variantAggregateStock
        : numericStockQuantity;
    const normalizedStock = stock || (finalStockQuantity <= 0
        ? 'out_of_stock'
        : finalStockQuantity <= 10
            ? 'low_stock'
            : 'in_stock');

    const Product = mongoose.model('Product');

    const product = await Product.create({
        name,
        sku,
        slug,
        stock: normalizedStock,
        stockQuantity: finalStockQuantity,
        categoryId,
        brandId: brandId || null,
        vendorId,
        ...rest,
        variants: normalizedVariants,
        faqs: sanitizeFaqs(rest.faqs),
    });
    res.status(201).json(new ApiResponse(201, { ...product.toObject(), id: String(product._id) }, 'Product created.'));
});

// PUT /api/admin/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    const Product = mongoose.model('Product');

    if (payload.name) {
        payload.slug = slugify(payload.name) + '-' + Date.now();
    }

    if (payload.stockQuantity !== undefined) {
        const numericStockQuantity = Number(payload.stockQuantity) || 0;
        payload.stockQuantity = numericStockQuantity;
        if (!payload.stock) {
            payload.stock = numericStockQuantity <= 0
                ? 'out_of_stock'
                : numericStockQuantity <= 10
                    ? 'low_stock'
                    : 'in_stock';
        }
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'faqs')) {
        payload.faqs = sanitizeFaqs(payload.faqs);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'variants')) {
        const fallbackPrice =
            Object.prototype.hasOwnProperty.call(payload, 'price')
                ? payload.price
                : (await Product.findOne({ _id: req.params.id }).select('price').lean())?.price;
        payload.variants = normalizeVariantsPayload(payload.variants, fallbackPrice);
        const variantAggregateStock = calculateVariantAggregateStock(payload.variants);
        if (Number.isFinite(variantAggregateStock)) {
            payload.stockQuantity = variantAggregateStock;
            if (!payload.stock) {
                payload.stock = variantAggregateStock <= 0
                    ? 'out_of_stock'
                    : variantAggregateStock <= 10
                        ? 'low_stock'
                        : 'in_stock';
            }
        }
    }

    const product = await Product.findOneAndUpdate(
        { _id: req.params.id },
        { $set: payload },
        { new: true }
    ).lean();

    if (!product) throw new ApiError(404, 'Product not found.');
    res.status(200).json(new ApiResponse(200, { ...product, id: String(product._id) }, 'Product updated.'));
});

// DELETE /api/admin/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const product = await Product.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { isActive: false } },
        { new: true }
    ).lean();

    if (!product) throw new ApiError(404, 'Product not found.');
    res.status(200).json(new ApiResponse(200, null, 'Product disabled.'));
});

// GET /api/admin/products/tax-pricing-rules
export const getTaxPricingRules = asyncHandler(async (req, res) => {
    const Settings = mongoose.model('Settings');
    const settings = await Settings.findOne({ key: 'product_tax_pricing_rules' }).lean();
    const value = settings?.value || {};
    const taxRules = Array.isArray(value.taxRules) ? value.taxRules : [];
    const pricingRules = Array.isArray(value.pricingRules) ? value.pricingRules : [];

    res.status(200).json(
        new ApiResponse(200, { taxRules, pricingRules }, 'Tax and pricing rules fetched.')
    );
});

// PUT /api/admin/products/tax-pricing-rules
export const updateTaxPricingRules = asyncHandler(async (req, res) => {
    const { taxRules = [], pricingRules = [] } = req.body;
    const data = { taxRules, pricingRules };

    const Settings = mongoose.model('Settings');

    await Settings.findOneAndUpdate(
        { key: 'product_tax_pricing_rules' },
        { $set: { value: data } },
        { upsert: true, new: true }
    );

    res.status(200).json(
        new ApiResponse(200, { taxRules, pricingRules }, 'Tax and pricing rules updated.')
    );
});

// GET /api/admin/categories
export const getAllCategories = asyncHandler(async (req, res) => {
    const Category = mongoose.model('Category');
    const categories = await Category.find({})
        .sort({ order: 1, name: 1 })
        .lean();

    const mapped = categories.map(c => ({ ...c, id: String(c._id) }));
    res.status(200).json(new ApiResponse(200, mapped, 'Categories fetched.'));
});

// POST /api/admin/categories
export const createCategory = asyncHandler(async (req, res) => {
    const payload = sanitizeCategoryPayload(req.body);
    const { name, ...rest } = payload;
    await assertValidCategoryParent({ parentId: rest.parentId });
    const slug = slugify(name);

    const Category = mongoose.model('Category');

    const category = await Category.create({ name, slug, ...rest });
    res.status(201).json(new ApiResponse(201, { ...category.toObject(), id: String(category._id) }, 'Category created.'));
});

// PUT /api/admin/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
    const Category = mongoose.model('Category');
    const existingCategory = await Category.findOne({ _id: req.params.id }).lean();
    if (!existingCategory) throw new ApiError(404, 'Category not found.');

    const payload = sanitizeCategoryPayload(req.body);
    await assertValidCategoryParent({
        categoryId: existingCategory._id,
        parentId: payload.parentId,
    });

    if (payload.name) {
        payload.slug = slugify(payload.name);
    }

    const category = await Category.findOneAndUpdate(
        { _id: req.params.id },
        { $set: payload },
        { new: true }
    ).lean();

    if (!category) throw new ApiError(404, 'Category not found.');
    res.status(200).json(new ApiResponse(200, { ...category, id: String(category._id) }, 'Category updated.'));
});

// DELETE /api/admin/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
    const Category = mongoose.model('Category');
    const Product = mongoose.model('Product');

    const category = await Category.findOne({ _id: req.params.id }).select('_id').lean();
    if (!category) {
        throw new ApiError(404, 'Category not found.');
    }

    const [subcategoriesCount, productsCount] = await Promise.all([
        Category.countDocuments({ parentId: req.params.id }),
        Product.countDocuments({ categoryId: req.params.id }),
    ]);

    if (subcategoriesCount > 0) {
        throw new ApiError(409, 'Cannot delete category with existing subcategories.');
    }
    if (productsCount > 0) {
        throw new ApiError(409, 'Cannot delete category with existing products.');
    }

    await Category.deleteOne({ _id: req.params.id });
    res.status(200).json(new ApiResponse(200, null, 'Category deleted.'));
});

// PATCH /api/admin/categories/reorder
export const reorderCategories = asyncHandler(async (req, res) => {
    const uniqueIds = Array.from(new Set(req.body.categoryIds.map((id) => String(id))));

    const Category = mongoose.model('Category');

    const rootCategories = await Category.find({
        _id: { $in: uniqueIds },
        parentId: null,
    }).select('_id').lean();

    if (rootCategories.length !== uniqueIds.length) {
        throw new ApiError(400, 'Only root categories can be reordered.');
    }

    await runInTransaction(async (session) => {
        for (let index = 0; index < uniqueIds.length; index++) {
            const id = uniqueIds[index];
            await Category.updateOne(
                { _id: id },
                { $set: { order: index + 1 } },
                { session }
            );
        }
    });

    const categories = await Category.find({})
        .sort({ order: 1, name: 1 })
        .lean();

    const mapped = categories.map(c => ({ ...c, id: String(c._id) }));
    res.status(200).json(new ApiResponse(200, mapped, 'Category order updated.'));
});

// GET /api/admin/brands
export const getAllBrands = asyncHandler(async (req, res) => {
    const Brand = mongoose.model('Brand');
    const brands = await Brand.find({})
        .sort({ name: 1 })
        .lean();

    const mapped = brands.map(b => ({ ...b, id: String(b._id) }));
    res.status(200).json(new ApiResponse(200, mapped, 'Brands fetched.'));
});

// POST /api/admin/brands
export const createBrand = asyncHandler(async (req, res) => {
    const payload = sanitizeBrandPayload(req.body);
    const { name, ...rest } = payload;
    const slug = slugify(name);

    const Brand = mongoose.model('Brand');

    const brand = await Brand.create({ name, slug, ...rest });
    res.status(201).json(new ApiResponse(201, { ...brand.toObject(), id: String(brand._id) }, 'Brand created.'));
});

// PUT /api/admin/brands/:id
export const updateBrand = asyncHandler(async (req, res) => {
    const payload = sanitizeBrandPayload(req.body);
    if (payload.name) {
        payload.slug = slugify(payload.name);
    }

    const Brand = mongoose.model('Brand');

    const brand = await Brand.findOneAndUpdate(
        { _id: req.params.id },
        { $set: payload },
        { new: true }
    ).lean();

    if (!brand) throw new ApiError(404, 'Brand not found.');
    res.status(200).json(new ApiResponse(200, { ...brand, id: String(brand._id) }, 'Brand updated.'));
});

// DELETE /api/admin/brands/:id
export const deleteBrand = asyncHandler(async (req, res) => {
    const Brand = mongoose.model('Brand');
    const Product = mongoose.model('Product');

    const brand = await Brand.findOne({ _id: req.params.id }).select('_id').lean();
    if (!brand) throw new ApiError(404, 'Brand not found.');

    const linkedProductsCount = await Product.countDocuments({ brandId: req.params.id });
    if (linkedProductsCount > 0) {
        throw new ApiError(409, 'Cannot delete brand with existing products.');
    }

    await Brand.deleteOne({ _id: req.params.id });
    res.status(200).json(new ApiResponse(200, null, 'Brand deleted.'));
});
