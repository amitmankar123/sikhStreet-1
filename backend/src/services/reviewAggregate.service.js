import mongoose from 'mongoose';

const round2 = (value) => Number(Number(value || 0).toFixed(2));

export const syncProductAndVendorReviewStats = async (productId) => {
    if (!productId) return;

    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');
    const Vendor = mongoose.model('Vendor');

    const product = await Product.findOne({ _id: productId }).select('vendorId').lean();
    if (!product) return;

    // Aggregate stats for product reviews
    const productStats = await Review.aggregate([
        {
            $match: {
                productId: String(product._id),
                isApproved: true,
                isHidden: { $ne: true }
            }
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                avgRating: { $avg: "$rating" }
            }
        }
    ]);

    const reviewCount = productStats[0]?.count || 0;
    const avgRating = round2(productStats[0]?.avgRating || 0);

    await Product.updateOne(
        { _id: product._id },
        {
            $set: {
                reviewCount,
                rating: avgRating,
            }
        }
    );

    const vendorId = product.vendorId;
    if (!vendorId) return;

    // Get all products owned by this vendor
    const vendorProducts = await Product.find({ vendorId }).select('_id').lean();
    const productIds = vendorProducts.map((p) => String(p._id)).filter(Boolean);

    if (productIds.length === 0) {
        await Vendor.updateOne(
            { _id: vendorId },
            { $set: { reviewCount: 0, rating: 0 } }
        );
        return;
    }

    // Aggregate stats for all reviews of the vendor's products
    const vendorStats = await Review.aggregate([
        {
            $match: {
                productId: { $in: productIds },
                isApproved: true,
                isHidden: { $ne: true }
            }
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                avgRating: { $avg: "$rating" }
            }
        }
    ]);

    const vendorReviewCount = vendorStats[0]?.count || 0;
    const vendorAvgRating = round2(vendorStats[0]?.avgRating || 0);

    await Vendor.updateOne(
        { _id: vendorId },
        {
            $set: {
                reviewCount: vendorReviewCount,
                rating: vendorAvgRating,
            }
        }
    );
};
