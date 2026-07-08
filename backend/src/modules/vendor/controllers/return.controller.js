import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { createNotification } from '../../../services/notification.service.js';

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

const normalizeReturnRequest = (requestDoc) => {
    if (!requestDoc) return null;
    const orderOrderId = requestDoc.order?.orderId;
    const orderRefId = requestDoc.orderId || null;

    return {
        ...requestDoc,
        id: String(requestDoc._id || requestDoc.id),
        userId: requestDoc.user || null,
        orderId: orderOrderId || String(orderRefId || ''),
        orderRefId: orderRefId ? String(orderRefId) : null,
        customer: requestDoc.user
            ? {
                name: requestDoc.user.name ?? 'Guest',
                email: requestDoc.user.email ?? 'N/A',
                phone: requestDoc.user.phone ?? '',
            }
            : { name: 'Guest', email: 'N/A', phone: '' },
        requestDate: requestDoc.createdAt,
        rejectionReason: requestDoc.rejectionReason || requestDoc.adminNote || '',
        items: enrichReturnItems(requestDoc),
    };
};

// GET /api/vendor/return-requests
export const getVendorReturnRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 20);

    const ReturnRequest = mongoose.model('ReturnRequest');
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');

    const filter = { vendorId: req.user.id };
    if (status && status !== 'all') {
        filter.status = status;
    }

    if (search) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const matchedOrders = await Order.find({
            orderId: { $regex: String(search).trim(), $options: 'i' }
        }).select('_id').lean();

        const matchedUsers = await User.find({
            $or: [
                { name: { $regex: String(search).trim(), $options: 'i' } },
                { email: { $regex: String(search).trim(), $options: 'i' } },
                { phone: { $regex: String(search).trim(), $options: 'i' } }
            ]
        }).select('_id').lean();

        const orderIds = matchedOrders.map((o) => String(o._id));
        const userIds = matchedUsers.map((u) => String(u._id));

        filter.$or = [
            { reason: { $regex: String(search).trim(), $options: 'i' } },
            ...(orderIds.length > 0 ? [{ orderId: { $in: orderIds } }] : []),
            ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
            ...(uuidRegex.test(search) ? [{ _id: search }] : []),
        ];
    }

    const [requests, total] = await Promise.all([
        ReturnRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip((numericPage - 1) * numericLimit)
            .limit(numericLimit)
            .lean(),
        ReturnRequest.countDocuments(filter),
    ]);

    const userIds = [...new Set(requests.map(r => r.userId).filter(Boolean))];
    const orderIds = [...new Set(requests.map(r => r.orderId).filter(Boolean))];

    const [users, orders] = await Promise.all([
        User.find({ _id: { $in: userIds } }).select('name email phone').lean(),
        Order.find({ _id: { $in: orderIds } }).select('orderId total items vendorItems status paymentStatus').lean()
    ]);

    const normalized = requests.map(r => {
        const user = users.find(u => String(u._id) === String(r.userId));
        const order = orders.find(o => String(o._id) === String(r.orderId));
        return normalizeReturnRequest({
            ...r,
            user,
            order
        });
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                returnRequests: normalized,
                pagination: {
                    total,
                    page: numericPage,
                    limit: numericLimit,
                    pages: Math.ceil(total / numericLimit),
                },
            },
            'Return requests fetched.'
        )
    );
});

// GET /api/vendor/return-requests/:id
export const getVendorReturnRequestById = asyncHandler(async (req, res) => {
    const ReturnRequest = mongoose.model('ReturnRequest');
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');

    const request = await ReturnRequest.findOne({
        _id: req.params.id,
        vendorId: req.user.id,
    }).lean();

    if (!request) throw new ApiError(404, 'Return request not found.');

    const [user, order] = await Promise.all([
        request.userId ? User.findOne({ _id: request.userId }).select('name email phone').lean() : null,
        request.orderId ? Order.findOne({ _id: request.orderId }).select('orderId total createdAt items vendorItems status paymentStatus').lean() : null
    ]);

    const enriched = {
        ...request,
        user,
        order
    };

    res.status(200).json(
        new ApiResponse(200, normalizeReturnRequest(enriched), 'Return request fetched.')
    );
});

// PATCH /api/vendor/return-requests/:id/status
export const updateVendorReturnRequestStatus = asyncHandler(async (req, res) => {
    const { status, refundStatus, rejectionReason } = req.body;
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
        throw new ApiError(
            400,
            `Refund status must be one of: ${allowedRefundStatuses.join(', ')}`
        );
    }

    const ReturnRequest = mongoose.model('ReturnRequest');
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');
    const Product = mongoose.model('Product');
    const Commission = mongoose.model('Commission');
    const Admin = mongoose.model('Admin');

    const request = await ReturnRequest.findOne({
        _id: req.params.id,
        vendorId: req.user.id,
    });
    if (!request) throw new ApiError(404, 'Return request not found.');

    const [user, order] = await Promise.all([
        request.userId ? User.findOne({ _id: request.userId }).select('id name email phone').lean() : null,
        request.orderId ? Order.findOne({ _id: request.orderId }).select('id orderId total items vendorItems status paymentStatus isDeleted').lean() : null
    ]);

    const requestWithOrderAndUser = {
        ...request.toObject(),
        user,
        order
    };

    const nextStatus = status || request.status;
    const nextRefundStatus = refundStatus || request.refundStatus;
    const nextRejectionReason = rejectionReason !== undefined
        ? String(rejectionReason || '').trim()
        : String(request.rejectionReason || '');
    const statusUnchanged = !status || status === request.status;
    const refundUnchanged = !refundStatus || refundStatus === request.refundStatus;
    const rejectionReasonUnchanged =
        rejectionReason === undefined || nextRejectionReason === String(request.rejectionReason || '');

    if (statusUnchanged && refundUnchanged && rejectionReasonUnchanged) {
        return res.status(200).json(
            new ApiResponse(200, normalizeReturnRequest(requestWithOrderAndUser), 'No changes applied.')
        );
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
    if (refundStatus) request.refundStatus = nextRefundStatus;
    if (status === 'rejected') {
        request.rejectionReason = nextRejectionReason;
    } else if (status) {
        request.rejectionReason = '';
    }
    await request.save();

    const updatedRequest = {
        ...request.toObject(),
        user,
        order
    };

    if (status === 'approved' || status === 'completed') {
        if (order && order.isDeleted !== true) {
            const vendorGroups = Array.isArray(order.vendorItems) ? order.vendorItems : [];
            const uniqueVendorIds = [
                ...new Set(vendorGroups.map((group) => String(group?.vendorId || '')).filter(Boolean)),
            ];
            const isSingleVendorOrder = uniqueVendorIds.length <= 1;

            if (status === 'approved' && isSingleVendorOrder && !['cancelled', 'returned'].includes(order.status)) {
                await Order.updateOne(
                    { _id: order._id },
                    { $set: { status: 'returned' } }
                );
            }

            if (status === 'completed') {
                const returnItems = Array.isArray(updatedRequest.items) ? updatedRequest.items : [];
                for (const item of returnItems) {
                    const qty = Number(item?.quantity || 0);
                    if (!item?.productId || qty <= 0) continue;

                    const product = await Product.findOne({ _id: item.productId });
                    if (!product) continue;

                    const newStockQty = product.stockQuantity + qty;
                    const nextStockState = newStockQty <= 0
                        ? 'out_of_stock'
                        : (newStockQty <= product.lowStockThreshold ? 'low_stock' : 'in_stock');

                    product.stockQuantity = newStockQty;
                    product.stock = nextStockState;
                    await product.save();
                }

                await Commission.updateMany(
                    {
                        orderId: order._id,
                        vendorId: req.user.id,
                        status: { $ne: 'cancelled' },
                    },
                    {
                        $set: {
                            status: 'cancelled',
                            paidAt: null,
                            settlementId: null,
                        }
                    }
                );

                const completedReturns = await ReturnRequest.find({
                    orderId: order._id,
                    status: 'completed',
                }).select('vendorId').lean();

                const completedVendorSet = new Set(
                    completedReturns.map((entry) => String(entry?.vendorId || '')).filter(Boolean)
                );
                const allVendorsCompleted =
                    uniqueVendorIds.length > 0 && uniqueVendorIds.every((vendorId) => completedVendorSet.has(vendorId));

                if (allVendorsCompleted) {
                    await Order.updateOne(
                        { _id: order._id },
                        {
                            $set: {
                                status: order.status !== 'cancelled' ? 'returned' : undefined,
                                paymentStatus: 'refunded'
                            }
                        }
                    );
                }
            }
        }
    }

    const notificationTasks = [
        createNotification({
            recipientId: req.user.id,
            recipientType: 'vendor',
            title: 'Return request updated',
            message: `Return request for order ${updatedRequest.order?.orderId || updatedRequest.orderId} updated.`,
            type: 'order',
            data: {
                returnRequestId: String(updatedRequest._id),
                orderId: String(updatedRequest.order?.orderId || updatedRequest.orderId || ''),
                status: String(updatedRequest.status),
                refundStatus: String(updatedRequest.refundStatus || ''),
            },
        }),
    ];

    if (updatedRequest.user?.id || updatedRequest.user?._id) {
        notificationTasks.push(
            createNotification({
                recipientId: updatedRequest.user.id || updatedRequest.user._id,
                recipientType: 'user',
                title: 'Return request status updated',
                message: `Your return request for order ${updatedRequest.order?.orderId || updatedRequest.orderId} is now ${updatedRequest.status}.`,
                type: 'order',
                data: {
                    returnRequestId: String(updatedRequest._id),
                    orderId: String(updatedRequest.order?.orderId || updatedRequest.orderId || ''),
                    status: String(updatedRequest.status),
                    refundStatus: String(updatedRequest.refundStatus || ''),
                },
            })
        );
    }

    const admins = await Admin.find({ isActive: true }).select('_id').lean();
    
    admins.forEach((admin) => {
        notificationTasks.push(
            createNotification({
                recipientId: String(admin._id),
                recipientType: 'admin',
                title: 'Return request updated',
                message: `Return request for order ${updatedRequest.order?.orderId || updatedRequest.orderId} moved to ${updatedRequest.status}.`,
                type: 'order',
                data: {
                    returnRequestId: String(updatedRequest._id),
                    orderId: String(updatedRequest.order?.orderId || updatedRequest.orderId || ''),
                    status: String(updatedRequest.status),
                    refundStatus: String(updatedRequest.refundStatus || ''),
                },
            })
        );
    });

    await Promise.allSettled(notificationTasks);

    res.status(200).json(
        new ApiResponse(
            200,
            normalizeReturnRequest(updatedRequest),
            'Return request status updated.'
        )
    );
});
