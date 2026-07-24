import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

const mapWishlistItems = (items, products, vendors) => {
    return items
        .map(item => {
            const product = products.find(p => p._id === item.productId);
            if (!product || product.isActive === false) return null;
            const vendor = vendors.find(v => v._id === product.vendorId);
            if (!vendor || vendor.status === 'suspended') return null;
            return {
                _id: item._id,
                id: item._id,
                productId: {
                    _id: product._id,
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    image: product.image || (product.images && product.images[0]) || '',
                    stock: product.stock,
                    unit: product.unit,
                    rating: product.rating || 0
                },
                addedAt: item.addedAt
            };
        })
        .filter(Boolean);
};

// GET /api/user/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
    const Wishlist = mongoose.model('Wishlist');
    const WishlistItem = mongoose.model('WishlistItem');
    const Product = mongoose.model('Product');
    const Vendor = mongoose.model('Vendor');

    const wishlist = await Wishlist.findOne({ userId: req.user.id }).lean();
    if (!wishlist) {
        return res.status(200).json(new ApiResponse(200, [], 'Wishlist fetched.'));
    }

    const items = await WishlistItem.find({ wishlistId: wishlist._id }).lean();
    const productIds = items.map(item => item.productId);

    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const vendorIds = [...new Set(products.map(p => p.vendorId).filter(Boolean))];
    const vendors = await Vendor.find({ _id: { $in: vendorIds } }).lean();

    const filteredItems = mapWishlistItems(items, products, vendors);

    res.status(200).json(new ApiResponse(200, filteredItems, 'Wishlist fetched.'));
});

// POST /api/user/wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const normalizedProductId = String(productId || '').trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(normalizedProductId)) {
        throw new ApiError(400, 'Invalid product id.');
    }

    const Product = mongoose.model('Product');
    const Wishlist = mongoose.model('Wishlist');
    const WishlistItem = mongoose.model('WishlistItem');
    const Vendor = mongoose.model('Vendor');

    const product = await Product.findOne({ _id: normalizedProductId, isActive: true }).lean();
    if (!product) {
        throw new ApiError(404, 'Product not found.');
    }

    const vendor = await Vendor.findOne({ _id: product.vendorId }).lean();
    if (!vendor || vendor.status === 'suspended') {
        throw new ApiError(404, 'Product not found.');
    }

    let wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
        wishlist = await Wishlist.create({
            userId: req.user.id
        });
    }

    const exists = await WishlistItem.findOne({
        wishlistId: wishlist._id,
        productId: normalizedProductId
    });
    if (exists) throw new ApiError(409, 'Product already in wishlist.');

    await WishlistItem.create({
        wishlistId: wishlist._id,
        productId: normalizedProductId
    });

    const items = await WishlistItem.find({ wishlistId: wishlist._id }).lean();
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const vendorIds = [...new Set(products.map(p => p.vendorId).filter(Boolean))];
    const vendors = await Vendor.find({ _id: { $in: vendorIds } }).lean();

    const filteredItems = mapWishlistItems(items, products, vendors);

    res.status(201).json(new ApiResponse(201, filteredItems, 'Added to wishlist.'));
});

// DELETE /api/user/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
    const normalizedProductId = String(req.params.productId || '').trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(normalizedProductId)) {
        throw new ApiError(400, 'Invalid product id.');
    }

    const Product = mongoose.model('Product');
    const Wishlist = mongoose.model('Wishlist');
    const WishlistItem = mongoose.model('WishlistItem');
    const Vendor = mongoose.model('Vendor');

    const wishlist = await Wishlist.findOne({ userId: req.user.id }).lean();
    if (!wishlist) {
        res.status(200).json(new ApiResponse(200, [], 'Removed from wishlist.'));
        return;
    }

    await WishlistItem.deleteMany({
        wishlistId: wishlist._id,
        productId: normalizedProductId
    });

    const items = await WishlistItem.find({ wishlistId: wishlist._id }).lean();
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const vendorIds = [...new Set(products.map(p => p.vendorId).filter(Boolean))];
    const vendors = await Vendor.find({ _id: { $in: vendorIds } }).lean();

    const filteredItems = mapWishlistItems(items, products, vendors);

    res.status(200).json(new ApiResponse(200, filteredItems, 'Removed from wishlist.'));
});
