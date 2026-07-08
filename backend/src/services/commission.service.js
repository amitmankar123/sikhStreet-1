import mongoose from 'mongoose';

/**
 * Calculate commission for a vendor order item group
 * @param {string} vendorId
 * @param {number} subtotal
 * @returns {{ commission, vendorEarnings, commissionRate }}
 */
export const calculateCommission = async (vendorId, subtotal) => {
    const Vendor = mongoose.model('Vendor');
    const vendor = await Vendor.findOne({ _id: vendorId }).select('commissionRate').lean();
    if (!vendor) throw new Error(`Vendor not found: ${vendorId}`);

    const commissionRate = vendor.commissionRate || 10;
    const commission = parseFloat(((subtotal * commissionRate) / 100).toFixed(2));
    const vendorEarnings = parseFloat((subtotal - commission).toFixed(2));

    return { commissionRate, commission, vendorEarnings };
};

/**
 * Get commission summary for a vendor
 */
export const getVendorCommissionSummary = async (vendorId) => {
    const Commission = mongoose.model('Commission');
    const groupStats = await Commission.aggregate([
        { $match: { vendorId: String(vendorId) } },
        {
            $group: {
                _id: "$status",
                total: { $sum: "$vendorEarnings" },
                count: { $sum: 1 }
            }
        }
    ]);

    return groupStats.reduce((acc, r) => {
        acc[r._id] = { total: r.total || 0, count: r.count || 0 };
        return acc;
    }, {});
};
