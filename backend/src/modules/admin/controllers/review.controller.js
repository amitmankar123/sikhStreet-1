import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { syncProductAndVendorReviewStats } from '../../../services/reviewAggregate.service.js';

/**
 * @desc    Get all reviews with filtering and pagination
 * @route   GET /api/admin/reviews
 * @access  Private (Admin)
 */
export const getAllReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const skip = (numericPage - 1) * numericLimit;

    const Review = mongoose.model('Review');
    const User = mongoose.model('User');
    const Product = mongoose.model('Product');

    const filter = {};

    if (status === 'approved') filter.isApproved = true;
    if (status === 'pending') filter.isApproved = false;

    if (search) {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(search || ''));
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(String(search || ''));

        const [matchedUsers, matchedProducts] = await Promise.all([
            User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ]
            }).select('_id').limit(200).lean(),
            Product.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ]
            }).select('_id').limit(200).lean(),
        ]);

        const matchedUserIds = matchedUsers.map((u) => String(u._id));
        const matchedProductIds = matchedProducts.map((p) => String(p._id));

        filter.$or = [
            { comment: { $regex: search, $options: 'i' } },
            ...(matchedUserIds.length > 0 ? [{ userId: { $in: matchedUserIds } }] : []),
            ...(matchedProductIds.length > 0 ? [{ productId: { $in: matchedProductIds } }] : []),
            ...(isUuid || isObjectId ? [{ _id: search }, { productId: search }, { userId: search }] : [])
        ];
    }

    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Review.countDocuments(filter)
    ]);

    const userIds = [...new Set(reviews.map(r => r.userId).filter(Boolean))];
    const productIds = [...new Set(reviews.map(r => r.productId).filter(Boolean))];

    const [users, products] = await Promise.all([
        User.find({ _id: { $in: userIds } }).select('name email').lean(),
        Product.find({ _id: { $in: productIds } }).select('name').lean()
    ]);

    const normalizedReviews = reviews.map(review => {
        const user = users.find(u => String(u._id) === String(review.userId));
        const product = products.find(p => String(p._id) === String(review.productId));
        return {
            ...review,
            id: String(review._id),
            customerName: user ? user.name : 'Unknown',
            customerEmail: user ? user.email : 'N/A',
            productName: product ? product.name : 'Unknown Product',
            productId: review.productId || '',
            review: review.comment || '',
            status: review.isApproved ? 'approved' : 'pending'
        };
    });

    res.status(200).json(
        new ApiResponse(200, {
            reviews: normalizedReviews,
            pagination: {
                total,
                page: numericPage,
                limit: numericLimit,
                pages: Math.ceil(total / numericLimit)
            }
        }, 'Reviews fetched successfully')
    );
});

/**
 * @desc    Update review status (approve/reject)
 * @route   PATCH /api/admin/reviews/:id/status
 * @access  Private (Admin)
 */
export const updateReviewStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const Review = mongoose.model('Review');

    const review = await Review.findOne({ _id: req.params.id });

    if (!review) {
        throw new ApiError(404, 'Review not found');
    }

    let isApproved = review.isApproved;
    if (status === 'approved') {
        isApproved = true;
    } else if (status === 'rejected' || status === 'pending') {
        isApproved = false;
    }

    review.isApproved = isApproved;
    await review.save();

    await syncProductAndVendorReviewStats(review.productId);

    res.status(200).json(
        new ApiResponse(200, { ...review.toObject(), id: String(review._id) }, 'Review status updated successfully')
    );
});

/**
 * @desc    Delete a review
 * @route   DELETE /api/admin/reviews/:id
 * @access  Private (Admin)
 */
export const deleteReview = asyncHandler(async (req, res) => {
    const Review = mongoose.model('Review');

    const review = await Review.findOne({ _id: req.params.id });

    if (!review) {
        throw new ApiError(404, 'Review not found');
    }

    await Review.deleteOne({ _id: req.params.id });

    await syncProductAndVendorReviewStats(review.productId);

    res.status(200).json(
        new ApiResponse(200, {}, 'Review deleted successfully')
    );
});
