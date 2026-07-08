import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

/**
 * Validate a coupon code against a cart total
 * @param {string} code - Coupon code
 * @param {number} cartTotal - Cart subtotal
 * @returns {{ coupon, discount }}
 */
export const validateCoupon = async (code, cartTotal) => {
    const Coupon = mongoose.model('Coupon');
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
    if (!coupon || !coupon.isActive) throw new ApiError(400, 'Invalid coupon code.');
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) throw new ApiError(400, 'Coupon is not active yet.');
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new ApiError(400, 'Coupon has expired.');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached.');
    if (cartTotal < coupon.minOrderValue) throw new ApiError(400, `Minimum order value for this coupon is ₹${coupon.minOrderValue}.`);

    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = (cartTotal * coupon.value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
    }

    return { coupon, discount: parseFloat(discount.toFixed(2)) };
};

/**
 * Increment coupon usage count
 */
export const incrementCouponUsage = async (couponId) => {
    const Coupon = mongoose.model('Coupon');
    await Coupon.updateOne(
        { _id: couponId },
        { $inc: { usedCount: 1 } }
    );
};
