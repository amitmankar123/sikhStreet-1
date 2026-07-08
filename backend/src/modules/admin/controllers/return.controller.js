import mongoose from 'mongoose';
import { createNotification } from '../../../services/notification.service.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

const enrichReturnItems = (request) => {
    const orderItems = Array.isArray(request?.order?.items) ? request.order.items : [];
    const returnItems = Array.isArray(request?.items) ? request.items : [];

    return returnItems.map((item) => {
        const productId = String(item?.productId || '');
        const matchedOrderItem = orderItems.find(
            (orderItem) => String(orderItem?.productId || '') === productId
        );

        return {
            ...item,
            name: item?.name || matchedOrderItem?.name || 'Unknown Product',
            price: Number(item?.price ?? matchedOrderItem?.price ?? 0),
            image: item?.image || matchedOrderItem?.image || '',
        };
    });
};

const normalizeReturnRequest = (request) => ({
    ...request,
    id: String(request._id || request.id),
    customer: request.user
        ? {
            name: request.user.name,
            email: request.user.email,
            phone: request.user.phone
        }
        : { name: 'Guest', email: 'N/A' },
    orderId: request.order?.orderId || 'N/A',
    orderRefId: request.order?.id || request.order?._id || null,
    requestDate: request.createdAt,
    items: enrichReturnItems(request),
});

/**
 * @desc    Get all return requests with filtering and pagination
 * @route   GET /api/admin/return-requests
 * @access  Private (Admin)
 */
export const getAllReturnRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', status, startDate, endDate } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const skip = (numericPage - 1) * numericLimit;

    const ReturnRequest = mongoose.model('ReturnRequest');
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');

    const filter = {};

    if (status && status !== 'all') {
        filter.status = status;
    }
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (search) {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(search);
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(search);

        const [matchedOrders, matchedUsers] = await Promise.all([
            Order.find({
                orderId: { $regex: search, $options: 'i' }
            }).select('_id').limit(200).lean(),
            User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            }).select('_id').limit(200).lean()
        ]);

        const matchedOrderIds = matchedOrders.map((o) => String(o._id));
        const matchedUserIds = matchedUsers.map((u) => String(u._id));

        filter.$or = [
            { reason: { $regex: search, $options: 'i' } },
            ...(matchedOrderIds.length > 0 ? [{ orderId: { $in: matchedOrderIds } }] : []),
            ...(matchedUserIds.length > 0 ? [{ userId: { $in: matchedUserIds } }] : []),
            ...(isUuid || isObjectId ? [{ _id: search }, { orderId: search }] : [])
        ];
    }

    const [returnRequests, total] = await Promise.all([
        ReturnRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        ReturnRequest.countDocuments(filter)
    ]);

    const userIds = [...new Set(returnRequests.map(r => r.userId).filter(Boolean))];
    const orderIds = [...new Set(returnRequests.map(r => r.orderId).filter(Boolean))];

    const [users, orders] = await Promise.all([
        User.find({ _id: { $in: userIds } }).select('name email phone').lean(),
        Order.find({ _id: { $in: orderIds } }).select('orderId total items').lean()
    ]);

    const normalizedRequests = returnRequests.map(r => {
        const user = users.find(u => String(u._id) === String(r.userId));
        const order = orders.find(o => String(o._id) === String(r.orderId));
        return normalizeReturnRequest({
            ...r,
            user,
            order: order ? { ...order, id: String(order._id) } : null
        });
    });

    res.status(200).json(
        new ApiResponse(200, {
            returnRequests: normalizedRequests,
            pagination: {
                total,
                page: numericPage,
                limit: numericLimit,
                pages: Math.ceil(total / numericLimit)
            }
        }, 'Return requests fetched successfully')
    );
});

/**
 * @desc    Get return request detail
 * @route   GET /api/admin/return-requests/:id
 * @access  Private (Admin)
 */
export const getReturnRequestById = asyncHandler(async (req, res) => {
    const ReturnRequest = mongoose.model('ReturnRequest');
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');
    const Vendor = mongoose.model('Vendor');

    const request = await ReturnRequest.findOne({ _id: req.params.id }).lean();

    if (!request) {
        throw new ApiError(404, 'Return request not found');
    }

    const [user, order, vendor] = await Promise.all([
        request.userId ? User.findOne({ _id: request.userId }).select('name email phone').lean() : null,
        request.orderId ? Order.findOne({ _id: request.orderId }).select('orderId total createdAt items').lean() : null,
        request.vendorId ? Vendor.findOne({ _id: request.vendorId }).select('storeName email').lean() : null
    ]);

    const requestWithVendorLegacy = {
        ...request,
        user,
        order: order ? { ...order, id: String(order._id) } : null
    };

    if (vendor) {
        requestWithVendorLegacy.vendorId = {
            _id: request.vendorId,
            id: request.vendorId,
            shopName: vendor.storeName,
            email: vendor.email
        };
    }

    const normalized = normalizeReturnRequest(requestWithVendorLegacy);

    res.status(200).json(
        new ApiResponse(200, normalized, 'Return request details fetched successfully')
    );
});

/**
 * @desc    Update return request status
 * @route   PATCH /api/admin/return-requests/:id/status
 * @access  Private (Admin)
 */
export const updateReturnRequestStatus = asyncHandler(async (req, res) => {
    const { status, adminNote, refundStatus } = req.body;

    const ReturnRequest = mongoose.model('ReturnRequest');
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');
    const Product = mongoose.model('Product');

    const request = await ReturnRequest.findOne({ _id: req.params.id });

    if (!request) {
        throw new ApiError(404, 'Return request not found');
    }

    const [user, order] = await Promise.all([
        request.userId ? User.findOne({ _id: request.userId }).select('id name email phone').lean() : null,
        request.orderId ? Order.findOne({ _id: request.orderId }).select('id orderId total items').lean() : null
    ]);

    const requestWithOrderAndUser = {
        ...request.toObject(),
        user,
        order: order ? { ...order, id: String(order._id) } : null
    };

    const allowedStatuses = ['pending', 'approved', 'processing', 'rejected', 'completed'];
    const allowedRefundStatuses = ['pending', 'processed', 'failed'];
    const statusTransitions = {
        pending: ['approved', 'rejected'],
        approved: ['processing', 'completed'],
        processing: ['completed'],
        rejected: [],
        completed: [],
    };
    const refundTransitions = {
        pending: ['processed', 'failed'],
        failed: ['processed'],
        processed: [],
    };

    if (status && !allowedStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(', ')}`);
    }
    if (refundStatus && !allowedRefundStatuses.includes(refundStatus)) {
        throw new ApiError(400, `Refund status must be one of: ${allowedRefundStatuses.join(', ')}`);
    }

    const nextStatus = status || request.status;
    const nextRefundStatus = refundStatus || request.refundStatus || 'pending';
    const nextAdminNote = adminNote !== undefined ? adminNote : request.adminNote;
    const statusUnchanged = !status || status === request.status;
    const refundUnchanged = !refundStatus || refundStatus === request.refundStatus;
    const adminNoteUnchanged = adminNote === undefined || adminNote === request.adminNote;

    if (statusUnchanged && refundUnchanged && adminNoteUnchanged) {
        const normalizedNoop = normalizeReturnRequest(requestWithOrderAndUser);
        return res.status(200).json(new ApiResponse(200, normalizedNoop, 'No changes applied.'));
    }

    if (status && status !== request.status) {
        const allowedNext = statusTransitions[request.status] || [];
        if (!allowedNext.includes(status)) {
            throw new ApiError(409, `Cannot move return request from ${request.status} to ${status}.`);
        }
    }

    const currentRefundStatus = request.refundStatus || 'pending';
    if (refundStatus && refundStatus !== request.refundStatus) {
        const allowedRefundNext = refundTransitions[currentRefundStatus] || [];
        if (!allowedRefundNext.includes(refundStatus)) {
            throw new ApiError(409, `Cannot move refund status from ${currentRefundStatus} to ${refundStatus}.`);
        }
    }

    request.status = nextStatus;
    request.adminNote = nextAdminNote;
    request.refundStatus = nextRefundStatus;
    await request.save();

    const updatedRequest = {
        ...request.toObject(),
        user,
        order: order ? { ...order, id: String(order._id) } : null
    };

    // Return lifecycle side-effects:
    // - On approval, mark linked order as returned (if not terminal).
    // - On completion, restore stock for requested items once.
    if (status === 'approved' || status === 'completed') {
        const linkedOrderId = updatedRequest.orderId;
        if (linkedOrderId) {
            const orderDoc = await Order.findOne({ _id: linkedOrderId });
            if (orderDoc && orderDoc.isDeleted !== true) {
                if (status === 'approved' && !['cancelled', 'returned'].includes(orderDoc.status)) {
                    orderDoc.status = 'returned';
                    await orderDoc.save();
                }

                if (status === 'completed') {
                    const stockRestores = (updatedRequest.items || []).map(async (item) => {
                        const qty = Number(item?.quantity || 0);
                        if (!item?.productId || qty <= 0) return;
                        const product = await Product.findOne({ _id: item.productId });
                        if (!product) return;

                        const nextQty = product.stockQuantity + qty;
                        let nextStock = 'in_stock';
                        if (nextQty <= 0) nextStock = 'out_of_stock';
                        else if (nextQty <= product.lowStockThreshold) nextStock = 'low_stock';

                        product.stockQuantity = nextQty;
                        product.stock = nextStock;
                        await product.save();
                    });
                    await Promise.all(stockRestores);
                }
            }
        }
    }

    const notificationTasks = [];
    if (updatedRequest.userId) {
        notificationTasks.push(
            createNotification({
                recipientId: updatedRequest.userId,
                recipientType: 'user',
                title: 'Return request updated',
                message: `Your return request for order ${updatedRequest.order?.orderId || updatedRequest.orderId} is now ${updatedRequest.status}.`,
                type: 'order',
                data: {
                    returnRequestId: String(updatedRequest._id),
                    orderId: String(updatedRequest.order?.orderId || updatedRequest.orderId || ''),
                    status: String(updatedRequest.status || ''),
                    refundStatus: String(updatedRequest.refundStatus || ''),
                },
            })
        );
    }

    if (updatedRequest.vendorId) {
        notificationTasks.push(
            createNotification({
                recipientId: updatedRequest.vendorId,
                recipientType: 'vendor',
                title: 'Return request updated by admin',
                message: `Return request for order ${updatedRequest.order?.orderId || updatedRequest.orderId} is now ${updatedRequest.status}.`,
                type: 'order',
                data: {
                    returnRequestId: String(updatedRequest._id),
                    orderId: String(updatedRequest.order?.orderId || updatedRequest.orderId || ''),
                    status: String(updatedRequest.status || ''),
                    refundStatus: String(updatedRequest.refundStatus || ''),
                },
            })
        );
    }

    if (notificationTasks.length > 0) {
        await Promise.allSettled(notificationTasks);
    }

    const normalized = normalizeReturnRequest(updatedRequest);

    res.status(200).json(new ApiResponse(200, normalized, 'Return request status updated successfully'));
});
