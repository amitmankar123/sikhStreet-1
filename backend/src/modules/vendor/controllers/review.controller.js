import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { syncProductAndVendorReviewStats } from '../../../services/reviewAggregate.service.js';

const normalizeReview = (reviewDoc) => {
    if (!reviewDoc) return null;
    const status = reviewDoc.isHidden ? 'hidden' : reviewDoc.isApproved ? 'approved' : 'pending';

    return {
        ...reviewDoc,
        id: String(reviewDoc._id),
        productId: reviewDoc.productId,
        productName: reviewDoc.product?.name ?? 'Unknown Product',
        customerName: reviewDoc.user?.name ?? 'Unknown',
        customerEmail: reviewDoc.user?.email ?? 'N/A',
        status,
    };
};

// GET /api/vendor/reviews
export const getVendorReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, rating, productId } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 20);

    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');
    const User = mongoose.model('User');

    const vendorProducts = await Product.find({ vendorId: req.user.id }).select('_id').lean();
    const vendorProductIds = vendorProducts.map((p) => String(p._id));
    if (vendorProductIds.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    reviews: [],
                    pagination: { total: 0, page: numericPage, limit: numericLimit, pages: 0 },
                },
                'Reviews fetched.'
            )
        );
    }

    const filter = { productId: { $in: vendorProductIds } };
    if (rating) {
        const parsedRating = Number(rating);
        if (Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
            filter.rating = parsedRating;
        }
    }
    if (productId) {
        filter.productId = String(productId);
    }

    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .sort({ createdAt: -1 })
            .skip((numericPage - 1) * numericLimit)
            .limit(numericLimit)
            .lean(),
        Review.countDocuments(filter),
    ]);

    const userIds = [...new Set(reviews.map(r => r.userId).filter(Boolean))];
    const prodIds = [...new Set(reviews.map(r => r.productId).filter(Boolean))];

    const [users, products] = await Promise.all([
        User.find({ _id: { $in: userIds } }).select('name email').lean(),
        Product.find({ _id: { $in: prodIds } }).select('name').lean()
    ]);

    const normalized = reviews.map((r) => {
        const user = users.find(u => String(u._id) === String(r.userId));
        const product = products.find(p => String(p._id) === String(r.productId));
        return normalizeReview({
            ...r,
            user,
            product
        });
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                reviews: normalized,
                pagination: {
                    total,
                    page: numericPage,
                    limit: numericLimit,
                    pages: Math.ceil(total / numericLimit),
                },
            },
            'Reviews fetched.'
        )
    );
});

// PATCH /api/vendor/reviews/:id/status
export const updateVendorReviewStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ['approved', 'pending', 'hidden'];
    if (!allowed.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}`);
    }

    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');
    const User = mongoose.model('User');

    const review = await Review.findOne({ _id: req.params.id });
    if (!review) throw new ApiError(404, 'Review not found.');

    const product = await Product.findOne({ _id: review.productId }).select('name vendorId').lean();
    if (!product || String(product.vendorId) !== String(req.user.id)) {
        throw new ApiError(404, 'Review not found.');
    }

    let isApproved = review.isApproved;
    let isHidden = review.isHidden;
    if (status === 'approved') {
        isApproved = true;
        isHidden = false;
    } else if (status === 'hidden') {
        isApproved = false;
        isHidden = true;
    } else {
        isApproved = false;
        isHidden = false;
    }

    review.isApproved = isApproved;
    review.isHidden = isHidden;
    await review.save();

    const user = await User.findOne({ _id: review.userId }).select('name email').lean();

    const updated = {
        ...review.toObject(),
        user,
        product
    };

    await syncProductAndVendorReviewStats(review.productId);

    res.status(200).json(new ApiResponse(200, normalizeReview(updated), 'Review status updated.'));
});

// PATCH /api/vendor/reviews/:id/response
export const addVendorReviewResponse = asyncHandler(async (req, res) => {
    const { response } = req.body;
    const cleanResponse = String(response ?? '').trim();
    if (!cleanResponse) throw new ApiError(400, 'Response is required.');

    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');
    const User = mongoose.model('User');

    const review = await Review.findOne({ _id: req.params.id });
    if (!review) throw new ApiError(404, 'Review not found.');

    const product = await Product.findOne({ _id: review.productId }).select('name vendorId').lean();
    if (!product || String(product.vendorId) !== String(req.user.id)) {
        throw new ApiError(404, 'Review not found.');
    }

    review.vendorResponse = cleanResponse;
    review.responseDate = new Date();
    await review.save();

    const user = await User.findOne({ _id: review.userId }).select('name email').lean();

    const updated = {
        ...review.toObject(),
        user,
        product
    };

    res.status(200).json(new ApiResponse(200, normalizeReview(updated), 'Response added.'));
});
