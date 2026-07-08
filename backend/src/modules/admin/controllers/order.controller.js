import { runInTransaction } from '../../../utils/transaction.js';
import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { createNotification } from '../../../services/notification.service.js';

const normalizeVariantPart = (value) => String(value || '').trim().toLowerCase();
const normalizeAxisName = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
const createDynamicVariantKey = (selection = {}) =>
    Object.entries(selection || {})
        .map(([axis, value]) => [normalizeAxisName(axis), normalizeVariantPart(value)])
        .filter(([axis, value]) => axis && value)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([axis, value]) => `${axis}=${value}`)
        .join('|');

const toVariantPriceEntries = (variantPrices) => {
    if (!variantPrices) return [];
    if (typeof variantPrices === 'object') return Object.entries(variantPrices);
    return [];
};

const toVariantStockEntries = (stockMap) => {
    if (!stockMap) return [];
    if (typeof stockMap === 'object') return Object.entries(stockMap);
    return [];
};

const resolveOrderItemVariantKey = (product, orderItem) => {
    const explicitKey = String(orderItem?.variantKey || '').trim();
    if (explicitKey) return explicitKey;

    const stockEntries = toVariantStockEntries(product?.variants?.stockMap).map(([k]) => String(k).trim());
    const priceEntries = toVariantPriceEntries(product?.variants?.prices).map(([k]) => String(k).trim());
    const existingKeys = [...new Set([...stockEntries, ...priceEntries])];
    if (!existingKeys.length) return null;

    const dynamicSelection = Object.entries(orderItem?.variant || {}).reduce((acc, [axis, value]) => {
        const axisKey = normalizeAxisName(axis);
        const selectedValue = String(value || '').trim();
        if (axisKey && selectedValue) acc[axisKey] = selectedValue;
        return acc;
    }, {});
    const dynamicKey = createDynamicVariantKey(dynamicSelection);
    if (dynamicKey) {
        const exactDynamic = existingKeys.find((key) => key === dynamicKey);
        if (exactDynamic) return exactDynamic;
        const normalizedDynamic = existingKeys.find(
            (key) => normalizeVariantPart(key) === normalizeVariantPart(dynamicKey)
        );
        if (normalizedDynamic) return normalizedDynamic;
    }

    const size = normalizeVariantPart(orderItem?.variant?.size);
    const color = normalizeVariantPart(orderItem?.variant?.color);
    if (!size && !color) return null;

    const candidates = [
        `${size}|${color}`,
        `${size}-${color}`,
        `${size}_${color}`,
        `${size}:${color}`,
        size && !color ? size : null,
        color && !size ? color : null,
    ].filter(Boolean);

    for (const candidate of candidates) {
        const exact = existingKeys.find((key) => key === candidate);
        if (exact) return exact;
        const normalized = existingKeys.find((key) => normalizeVariantPart(key) === normalizeVariantPart(candidate));
        if (normalized) return normalized;
    }
    return null;
};

// GET /api/admin/orders
export const getAllOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20, search, startDate, endDate, userId } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const Order = mongoose.model('Order');
    const User = mongoose.model('User');
    const DeliveryBoy = mongoose.model('DeliveryBoy');

    const filter = { isDeleted: false };

    if (status && status !== 'all') filter.status = status;
    if (String(req.query.assignableOnly || '') === 'true' && !filter.status) {
        filter.status = { $in: ['pending', 'processing', 'shipped'] };
    }
    if (search) {
        const matchedUsers = await User.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]
        }).select('_id').limit(200).lean();
        const matchedUserIds = matchedUsers.map((u) => String(u._id));

        filter.$or = [
            { orderId: { $regex: search, $options: 'i' } },
            ...(matchedUserIds.length > 0 ? [{ userId: { $in: matchedUserIds } }] : []),
        ];
    }
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (req.query.vendorId) {
        filter["vendorItems.vendorId"] = req.query.vendorId;
    }
    if (userId) {
        filter.userId = userId;
    }
    if (String(req.query.onlyUnassigned || '') === 'true') {
        filter.deliveryBoyId = null;
    }

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Order.countDocuments(filter),
    ]);

    const usersIdsList = [...new Set(orders.map(o => o.userId).filter(Boolean))];
    const deliveryBoyIdsList = [...new Set(orders.map(o => o.deliveryBoyId).filter(Boolean))];

    const [users, deliveryBoys] = await Promise.all([
        User.find({ _id: { $in: usersIdsList } }).select('name email phone').lean(),
        DeliveryBoy.find({ _id: { $in: deliveryBoyIdsList } }).select('name phone').lean()
    ]);

    const mappedOrders = orders.map(order => {
        const user = users.find(u => String(u._id) === String(order.userId));
        const dbBoy = deliveryBoys.find(d => String(d._id) === String(order.deliveryBoyId));
        return {
            ...order,
            id: String(order._id),
            userId: user ? { _id: user._id, id: String(user._id), name: user.name, email: user.email, phone: user.phone } : null,
            deliveryBoyId: dbBoy ? { _id: dbBoy._id, id: String(dbBoy._id), name: dbBoy.name, phone: dbBoy.phone } : null
        };
    });

    res.status(200).json(new ApiResponse(200, {
        orders: mappedOrders,
        total,
        page: numericPage,
        pages: Math.ceil(total / numericLimit),
    }, 'Orders fetched.'));
});

// GET /api/admin/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');
    const DeliveryBoy = mongoose.model('DeliveryBoy');
    const Product = mongoose.model('Product');

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(req.params.id);
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(req.params.id);

    const order = await Order.findOne({
        $or: [
            { orderId: req.params.id },
            ...(isUuid || isObjectId ? [{ _id: req.params.id }] : [])
        ],
        isDeleted: false
    }).lean();

    if (!order) throw new ApiError(404, 'Order not found.');

    const [user, deliveryBoy] = await Promise.all([
        order.userId ? User.findOne({ _id: order.userId }).select('name email phone').lean() : null,
        order.deliveryBoyId ? DeliveryBoy.findOne({ _id: order.deliveryBoyId }).select('name phone email vehicleType vehicleNumber').lean() : null
    ]);

    const mapped = {
        ...order,
        id: String(order._id),
        userId: user ? { _id: user._id, id: String(user._id), name: user.name, email: user.email, phone: user.phone } : null,
        deliveryBoyId: deliveryBoy ? {
            _id: deliveryBoy._id,
            id: String(deliveryBoy._id),
            name: deliveryBoy.name,
            phone: deliveryBoy.phone,
            email: deliveryBoy.email,
            vehicleType: deliveryBoy.vehicleType,
            vehicleNumber: deliveryBoy.vehicleNumber
        } : null
    };

    const items = Array.isArray(order.items) ? order.items : [];
    const productIds = items.map(i => i.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } })
        .select('name images price image')
        .lean();

    const productMap = {};
    for (const p of dbProducts) {
        productMap[String(p._id)] = p;
    }

    mapped.items = items.map(item => {
        const prod = productMap[String(item.productId)];
        let image = null;
        if (prod) {
            if (Array.isArray(prod.images) && prod.images.length > 0) {
                image = prod.images[0];
            } else {
                image = prod.image;
            }
        }
        return {
            ...item,
            productId: prod ? {
                _id: prod._id,
                id: String(prod._id),
                name: prod.name,
                price: prod.price,
                images: prod.images || [],
                image: image
            } : null
        };
    });

    res.status(200).json(new ApiResponse(200, mapped, 'Order fetched.'));
});

// PATCH /api/admin/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!allowed.includes(status)) throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}`);

    const Order = mongoose.model('Order');
    const Product = mongoose.model('Product');
    const Commission = mongoose.model('Commission');

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(req.params.id);
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(req.params.id);

    const order = await Order.findOne({
        $or: [
            { orderId: req.params.id },
            ...(isUuid || isObjectId ? [{ _id: req.params.id }] : [])
        ],
        isDeleted: false
    });

    if (!order) throw new ApiError(404, 'Order not found.');

    const previousStatus = String(order.status || '').toLowerCase();
    const nextStatus = String(status || '').toLowerCase();

    const allowedTransitions = {
        pending: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered', 'cancelled', 'returned'],
        delivered: ['returned'],
        cancelled: [],
        returned: [],
    };

    if (previousStatus !== nextStatus) {
        const nextAllowed = allowedTransitions[previousStatus] || [];
        if (!nextAllowed.includes(nextStatus)) {
            throw new ApiError(409, `Cannot move order from ${previousStatus} to ${nextStatus}.`);
        }
    }

    const updateData = {
        status: nextStatus
    };

    if (nextStatus === 'delivered') {
        updateData.deliveredAt = new Date();
        updateData.cancelledAt = null;
    } else if (nextStatus === 'cancelled') {
        updateData.cancelledAt = new Date();
    } else if (nextStatus === 'returned') {
        updateData.cancelledAt = null;
    } else {
        updateData.deliveredAt = null;
        updateData.cancelledAt = null;
    }

    let vendorItems = Array.isArray(order.vendorItems) ? order.vendorItems : [];
    if (nextStatus === 'processing') {
        vendorItems = vendorItems.map((vi) => {
            const current = String(vi?.status || 'pending');
            if (current === 'cancelled' || current === 'delivered') return vi;
            return { ...vi, status: 'processing' };
        });
    }
    if (nextStatus === 'shipped') {
        vendorItems = vendorItems.map((vi) => {
            const current = String(vi?.status || 'pending');
            if (current === 'cancelled' || current === 'delivered') return vi;
            return { ...vi, status: 'shipped' };
        });
    }
    if (nextStatus === 'delivered') {
        vendorItems = vendorItems.map((vi) => {
            const current = String(vi?.status || 'pending');
            if (current === 'cancelled') return vi;
            return { ...vi, status: 'delivered' };
        });
    }
    if (nextStatus === 'cancelled') {
        vendorItems = vendorItems.map((vi) => {
            const current = String(vi?.status || 'pending');
            if (current === 'delivered') return vi;
            return { ...vi, status: 'cancelled' };
        });
    }
    updateData.vendorItems = vendorItems;

    await runInTransaction(async (session) => {
        if (nextStatus === 'cancelled' && previousStatus !== 'cancelled' && ['pending', 'processing', 'shipped'].includes(previousStatus)) {
            const items = Array.isArray(order.items) ? order.items : [];
            for (const item of items) {
                if (!item || !item.productId) continue;
                const product = await Product.findOne({ _id: item.productId }).session(session);
                if (!product) continue;

                const quantity = Number(item.quantity || 0);
                if (quantity <= 0) continue;

                const variantKey = resolveOrderItemVariantKey(product, item);
                const newStockQty = product.stockQuantity + quantity;
                const nextStockState = newStockQty <= 0
                    ? 'out_of_stock'
                    : (newStockQty <= product.lowStockThreshold ? 'low_stock' : 'in_stock');

                let updatedVariants = product.variants;
                if (variantKey && product.variants && typeof product.variants === 'object') {
                    const variantsObj = { ...product.variants };
                    const stockMapObj = variantsObj.stockMap ? { ...variantsObj.stockMap } : {};
                    const oldVal = Number(stockMapObj[variantKey] ?? 0);
                    stockMapObj[variantKey] = oldVal + quantity;
                    variantsObj.stockMap = stockMapObj;
                    updatedVariants = variantsObj;
                }

                product.stockQuantity = newStockQty;
                product.stock = nextStockState;
                product.variants = updatedVariants || undefined;
                await product.save({ session });
            }
        }

        if (nextStatus === 'cancelled') {
            await Commission.updateMany(
                {
                    orderId: order._id,
                    status: { $ne: 'cancelled' }
                },
                {
                    $set: {
                        status: 'cancelled',
                        paidAt: null,
                        settlementId: null
                    }
                }
            ).session(session);
        }

        order.status = nextStatus;
        order.vendorItems = vendorItems;
        if (updateData.deliveredAt !== undefined) order.deliveredAt = updateData.deliveredAt;
        if (updateData.cancelledAt !== undefined) order.cancelledAt = updateData.cancelledAt;
        await order.save({ session });
    });

    const notificationTasks = [];

    if (order.userId) {
        notificationTasks.push(
            createNotification({
                recipientId: order.userId,
                recipientType: 'user',
                title: 'Order status updated',
                message: `Your order ${order.orderId} is now ${status}.`,
                type: 'order',
                data: {
                    orderId: String(order.orderId),
                    status: String(nextStatus),
                },
            })
        );
    }

    const vendorIds = [
        ...new Set(
            vendorItems
                .map((item) => String(item?.vendorId || '').trim())
                .filter(Boolean)
        ),
    ];

    vendorIds.forEach((vendorId) => {
        notificationTasks.push(
            createNotification({
                recipientId: vendorId,
                recipientType: 'vendor',
                title: 'Order status updated by admin',
                message: `Order ${order.orderId} was updated to ${status} by admin.`,
                type: 'order',
                data: {
                    orderId: String(order.orderId),
                    status: String(nextStatus),
                },
            })
        );
    });

    if (order.deliveryBoyId) {
        notificationTasks.push(
            createNotification({
                recipientId: order.deliveryBoyId,
                recipientType: 'delivery',
                title: 'Assigned order updated',
                message: `Order ${order.orderId} is now ${status}.`,
                type: 'order',
                data: {
                    orderId: String(order.orderId),
                    status: String(nextStatus),
                },
            })
        );
    }

    if (notificationTasks.length > 0) {
        await Promise.allSettled(notificationTasks);
    }

    res.status(200).json(new ApiResponse(200, { ...order.toObject(), id: String(order._id) }, 'Order status updated.'));
});

// PATCH /api/admin/orders/:id/assign-delivery
export const assignDeliveryBoy = asyncHandler(async (req, res) => {
    const { deliveryBoyId } = req.body;
    if (!deliveryBoyId) throw new ApiError(400, 'deliveryBoyId is required.');

    const Order = mongoose.model('Order');
    const DeliveryBoy = mongoose.model('DeliveryBoy');

    const deliveryBoy = await DeliveryBoy.findOne({ _id: deliveryBoyId })
        .select('_id name isActive applicationStatus')
        .lean();
    if (!deliveryBoy) throw new ApiError(404, 'Delivery boy not found.');
    if (!deliveryBoy.isActive) throw new ApiError(400, 'Delivery boy is inactive.');
    if (deliveryBoy.applicationStatus !== 'approved') {
        throw new ApiError(400, 'Delivery boy is not approved.');
    }

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(req.params.id);
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(req.params.id);

    const order = await Order.findOne({
        $or: [
            { orderId: req.params.id },
            ...(isUuid || isObjectId ? [{ _id: req.params.id }] : [])
        ],
        isDeleted: false
    });
    if (!order) throw new ApiError(404, 'Order not found.');

    if (['cancelled', 'returned', 'delivered'].includes(String(order.status))) {
        throw new ApiError(409, `Cannot assign delivery for ${order.status} order.`);
    }

    const previousDeliveryBoyId = order.deliveryBoyId ? String(order.deliveryBoyId) : '';
    const isReassigned = previousDeliveryBoyId && previousDeliveryBoyId !== String(deliveryBoyId);

    order.deliveryBoyId = deliveryBoyId;

    let vendorItems = Array.isArray(order.vendorItems) ? order.vendorItems : [];
    if (order.status === 'pending') {
        order.status = 'processing';
        vendorItems = vendorItems.map((vi) => {
            const current = String(vi?.status || 'pending');
            if (current === 'cancelled' || current === 'delivered') return vi;
            return { ...vi, status: 'processing' };
        });
    }
    order.vendorItems = vendorItems;

    await order.save();

    await createNotification({
        recipientId: String(deliveryBoy._id),
        recipientType: 'delivery',
        title: isReassigned ? 'Order reassigned' : 'New order assigned',
        message: `${order.orderId} has been ${isReassigned ? 'reassigned to you' : 'assigned to you'}.`,
        type: 'order',
        data: {
            orderId: String(order.orderId),
            reassigned: isReassigned ? 'true' : 'false',
            assignedAt: new Date().toISOString(),
        },
    });

    const assignmentTasks = [];
    if (order.userId) {
        assignmentTasks.push(
            createNotification({
                recipientId: order.userId,
                recipientType: 'user',
                title: isReassigned ? 'Delivery partner updated' : 'Delivery assigned',
                message: `Order ${order.orderId} has a delivery partner assigned.`,
                type: 'order',
                data: {
                    orderId: String(order.orderId),
                    deliveryBoyId: String(deliveryBoy._id),
                },
            })
        );
    }

    const vendorIds = [
        ...new Set(
            vendorItems
                .map((item) => String(item?.vendorId || '').trim())
                .filter(Boolean)
        ),
    ];
    vendorIds.forEach((vendorId) => {
        assignmentTasks.push(
            createNotification({
                recipientId: vendorId,
                recipientType: 'vendor',
                title: isReassigned ? 'Delivery reassigned' : 'Delivery assigned',
                message: `Order ${order.orderId} has been assigned to a delivery partner.`,
                type: 'order',
                data: {
                    orderId: String(order.orderId),
                    deliveryBoyId: String(deliveryBoy._id),
                },
            })
        );
    });

    if (assignmentTasks.length > 0) {
        await Promise.allSettled(assignmentTasks);
    }

    res.status(200).json(new ApiResponse(200, { ...order.toObject(), id: String(order._id) }, 'Delivery boy assigned.'));
});

// DELETE /api/admin/orders/:id
export const deleteOrder = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(req.params.id);
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(req.params.id);

    const existing = await Order.findOne({
        $or: [
            { orderId: req.params.id },
            ...(isUuid || isObjectId ? [{ _id: req.params.id }] : [])
        ],
        isDeleted: false
    });

    if (!existing) throw new ApiError(404, 'Order not found.');

    existing.isDeleted = true;
    existing.deletedAt = new Date();
    existing.deletedBy = req.user?.id || req.user?._id || null;
    await existing.save();

    res.status(200).json(new ApiResponse(200, null, 'Order archived.'));
});
