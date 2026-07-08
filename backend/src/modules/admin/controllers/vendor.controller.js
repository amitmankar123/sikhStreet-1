import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { sendEmail } from '../../../services/email.service.js';
import { createNotification } from '../../../services/notification.service.js';

const toApiVendor = (vendor) => {
    if (!vendor) return null;
    const normalizedId = String(vendor._id || vendor.id || '');
    const normalizedCommissionRate = Number(vendor.commissionRate);
    return {
        ...vendor,
        id: normalizedId,
        commissionRate: Number.isFinite(normalizedCommissionRate)
            ? normalizedCommissionRate / 100
            : 0
    };
};

// GET /api/admin/vendors
export const getAllVendors = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20, search } = req.query;
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (numericPage - 1) * numericLimit;
    const filter = {};

    const Vendor = mongoose.model('Vendor');

    const allowedStatuses = new Set(['pending', 'approved', 'suspended', 'rejected']);
    if (typeof status === 'string' && status !== 'all' && allowedStatuses.has(status)) {
        filter.status = status;
    }

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
            .select('name email phone storeName storeLogo storeDescription status suspensionReason commissionRate isVerified rating reviewCount totalSales totalEarnings vendorType businessName businessType businessCountry businessAddress kycDocumentType kycDocumentUrl governmentIdDocumentUrl shippingEnabled freeShippingThreshold defaultShippingRate shippingMethods handlingTime processingTime address bankDetails documents joinDate createdAt updatedAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Vendor.countDocuments(filter)
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            vendors: vendors.map(toApiVendor),
            total,
            page: numericPage,
            pages: Math.ceil(total / numericLimit)
        }, 'Vendors fetched.')
    );
});

// GET /api/admin/vendors/:id
export const getVendorDetail = asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    const vendor = await Vendor.findOne({ _id: req.params.id })
        .select('name email phone storeName storeLogo storeDescription status suspensionReason commissionRate isVerified rating reviewCount totalSales totalEarnings vendorType businessName businessType businessCountry businessAddress kycDocumentType kycDocumentUrl governmentIdDocumentUrl shippingEnabled freeShippingThreshold defaultShippingRate shippingMethods handlingTime processingTime address bankDetails documents joinDate createdAt updatedAt')
        .lean();

    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    res.status(200).json(new ApiResponse(200, toApiVendor(vendor), 'Vendor detail fetched.'));
});

// PATCH /api/admin/vendors/:id/status
export const updateVendorStatus = asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const allowed = ['approved', 'suspended', 'rejected'];
    if (!allowed.includes(status)) throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}`);

    const Vendor = mongoose.model('Vendor');

    const vendor = await Vendor.findOneAndUpdate(
        { _id: req.params.id },
        {
            $set: {
                status,
                suspensionReason: reason || ''
            }
        },
        { new: true }
    ).lean();

    if (!vendor) throw new ApiError(404, 'Vendor not found.');

    const statusMessageMap = {
        approved: `Your vendor account for ${vendor.storeName || vendor.name} has been approved.`,
        rejected: `Your vendor account for ${vendor.storeName || vendor.name} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        suspended: `Your vendor account for ${vendor.storeName || vendor.name} has been suspended.${reason ? ` Reason: ${reason}` : ''}`,
    };
    const vendorMessage = statusMessageMap[status] || `Your vendor account status was updated to ${status}.`;

    await createNotification({
        recipientId: String(vendor._id),
        recipientType: 'vendor',
        title: 'Vendor Account Status Updated',
        message: vendorMessage,
        type: 'system',
        data: {
            status,
            reason: reason || '',
        },
    });

    try {
        await sendEmail({
            to: vendor.email,
            subject: `Vendor Account ${status[0].toUpperCase()}${status.slice(1)}`,
            text: vendorMessage,
            html: `<p>${vendorMessage}</p>`,
        });
    } catch (err) {
        console.warn(`Vendor status email failed for ${vendor.email}: ${err.message}`);
    }

    res.status(200).json(new ApiResponse(200, toApiVendor(vendor), `Vendor ${status} successfully.`));
});

// PATCH /api/admin/vendors/:id/commission
export const updateCommissionRate = asyncHandler(async (req, res) => {
    const { commissionRate } = req.body;
    const parsedRate = Number(commissionRate);
    if (Number.isNaN(parsedRate) || parsedRate < 0) {
        throw new ApiError(400, 'Commission rate must be a valid non-negative number.');
    }
    const dbCommissionRate = parsedRate <= 1 ? parsedRate * 100 : parsedRate;
    if (dbCommissionRate > 100) throw new ApiError(400, 'Commission rate must be between 0 and 100.');

    const Vendor = mongoose.model('Vendor');

    const vendor = await Vendor.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { commissionRate: dbCommissionRate } },
        { new: true }
    ).lean();

    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    res.status(200).json(new ApiResponse(200, toApiVendor(vendor), 'Commission rate updated.'));
});

// GET /api/admin/vendors/:id/commissions
export const getVendorCommissions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20, status = 'all' } = req.query;

    const Vendor = mongoose.model('Vendor');
    const Commission = mongoose.model('Commission');

    const vendor = await Vendor.findOne({ _id: id }).select('_id').lean();
    if (!vendor) throw new ApiError(404, 'Vendor not found.');

    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = { vendorId: String(vendor._id) };
    if (status && status !== 'all') {
        filter.status = status;
    }

    const [commissions, total] = await Promise.all([
        Commission.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Commission.countDocuments(filter),
    ]);

    const mappedCommissions = commissions.map(c => ({ ...c, id: String(c._id) }));

    res.status(200).json(
        new ApiResponse(
            200,
            {
                commissions: mappedCommissions,
                total,
                page: numericPage,
                pages: Math.ceil(total / numericLimit),
            },
            'Vendor commissions fetched.'
        )
    );
});
