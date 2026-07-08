import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { syncProductAndVendorReviewStats } from '../../../services/reviewAggregate.service.js';

// GET /api/user/reviews/product/:productId
export const getProductReviews = asyncHandler(async (req, res) => {
    const { sort = 'newest', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const Review = mongoose.model('Review');
    const User = mongoose.model('User');

    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'highest-rating': { rating: -1 },
        'lowest-rating': { rating: 1 },
        'most-helpful': { helpfulCount: -1 },
    };

    const sortObj = sortMap[sort] || { createdAt: -1 };

    const [reviews, total] = await Promise.all([
        Review.find({ productId: req.params.productId, isApproved: true })
            .sort(sortObj)
            .skip(Number(skip))
            .limit(Number(limit))
            .lean(),
        Review.countDocuments({ productId: req.params.productId, isApproved: true })
    ]);

    const userIds = [...new Set(reviews.map(r => r.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name avatar').lean();

    const formattedReviews = reviews.map((r) => {
        const user = users.find(u => String(u._id) === String(r.userId));
        return {
            ...r,
            id: String(r._id),
            userId: user ? {
                id: String(user._id),
                _id: user._id,
                name: user.name,
                avatar: user.avatar
            } : null
        };
    });

    res.status(200).json(new ApiResponse(200, { reviews: formattedReviews, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Reviews fetched.'));
});

// POST /api/user/reviews
export const addReview = asyncHandler(async (req, res) => {
    const { productId, orderId, rating, comment, images } = req.body;

    const Order = mongoose.model('Order');
    const Review = mongoose.model('Review');

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orderId);
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(orderId);

    // Verify purchase
    const order = await Order.findOne({
        $or: [
            { orderId: orderId },
            ...(isUuid || isObjectId ? [{ _id: orderId }] : [])
        ],
        userId: req.user.id,
        status: 'delivered',
    }).lean();

    if (!order) throw new ApiError(403, 'You can only review products you have purchased and received.');

    // Ensure product exists in order items
    const items = Array.isArray(order.items) ? order.items : [];
    const hasProduct = items.some((item) => String(item.productId) === String(productId));
    if (!hasProduct) {
        throw new ApiError(403, 'You can only review products you have purchased and received.');
    }

    const existing = await Review.findOne({
        productId,
        userId: req.user.id,
    }).lean();

    if (existing) throw new ApiError(409, 'You have already reviewed this product.');

    const review = await Review.create({
        productId,
        userId: req.user.id,
        orderId: String(order._id),
        rating: Number(rating),
        comment,
        images: images || null,
        isVerifiedPurchase: true,
        isApproved: true,
    });

    // Automatically recalculate product and vendor rating averages/counts
    await syncProductAndVendorReviewStats(productId);

    res.status(201).json(new ApiResponse(201, { ...review.toObject(), id: String(review._id) }, 'Review submitted and published.'));
});

// POST /api/user/reviews/:id/helpful
export const voteHelpful = asyncHandler(async (req, res) => {
    const Review = mongoose.model('Review');

    const existing = await Review.findOne({ _id: req.params.id });
    if (!existing) throw new ApiError(404, 'Review not found.');

    existing.helpfulCount = (existing.helpfulCount || 0) + 1;
    await existing.save();

    res.status(200).json(new ApiResponse(200, { ...existing.toObject(), id: String(existing._id) }, 'Vote recorded.'));
});
