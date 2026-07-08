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

const deriveTopLevelOrderStatus = (vendorItems = [], fallback = 'pending') => {
    const statuses = (vendorItems || [])
        .map((item) => String(item?.status || '').toLowerCase())
        .filter(Boolean);

    if (!statuses.length) return String(fallback || 'pending').toLowerCase();

    if (statuses.every((s) => s === 'cancelled')) return 'cancelled';
    if (statuses.every((s) => s === 'delivered')) return 'delivered';
    if (statuses.includes('shipped')) return 'shipped';
    if (statuses.includes('processing')) return 'processing';
    if (statuses.includes('pending')) return 'pending';

    return String(fallback || 'pending').toLowerCase();
};

// GET /api/vendor/orders
export const getVendorOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 20);
    const skip = (numericPage - 1) * numericLimit;

    const Order = mongoose.model('Order');
    const User = mongoose.model('User');

    const filter = { "vendorItems.vendorId": req.user.id };
    if (status) {
        filter.vendorItems = { $elemMatch: { vendorId: req.user.id, status } };
    }

    const [orders, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(numericLimit).lean(),
        Order.countDocuments(filter),
    ]);

    // Bulk-fetch users for all orders that have a userId
    const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
    const users = userIds.length
        ? await User.find({ _id: { $in: userIds } }).select('name email phone avatar').lean()
        : [];
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const mappedOrders = orders.map(o => {
        let customer = null;
        if (o.userId && userMap[String(o.userId)]) {
            const u = userMap[String(o.userId)];
            customer = { id: String(u._id), name: u.name || null, email: u.email || null, phone: u.phone || null, avatar: u.avatar || null };
        } else if (o.guestInfo) {
            customer = { id: null, name: o.guestInfo.name || o.guestInfo.fullName || null, email: o.guestInfo.email || null, phone: o.guestInfo.phone || null, avatar: null };
        }
        return { ...o, id: String(o._id), customer };
    });

    res.status(200).json(new ApiResponse(200, { orders: mappedOrders, total, page: numericPage, pages: Math.ceil(total / numericLimit) }, 'Orders fetched.'));
});


// GET /api/vendor/orders/:id
export const getVendorOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);

    const Order = mongoose.model('Order');
    const User = mongoose.model('User');

    const order = await Order.findOne({
        $or: [
            { orderId: id },
            ...(isUuid || isObjectId ? [{ _id: id }] : [])
        ],
        "vendorItems.vendorId": req.user.id
    }).lean();

    if (!order) throw new ApiError(404, 'Order not found.');

    // Populate customer info from the User collection
    let customer = null;
    if (order.userId) {
        const user = await User.findOne({ _id: order.userId }).select('name email phone avatar').lean();
        if (user) {
            customer = {
                id: String(user._id),
                name: user.name || null,
                email: user.email || null,
                phone: user.phone || null,
                avatar: user.avatar || null,
            };
        }
    }

    // Fallback to guestInfo if no registered user found
    if (!customer && order.guestInfo) {
        customer = {
            id: null,
            name: order.guestInfo.name || order.guestInfo.fullName || null,
            email: order.guestInfo.email || null,
            phone: order.guestInfo.phone || null,
            avatar: null,
        };
    }

    res.status(200).json(new ApiResponse(200, { ...order, id: String(order._id), customer }, 'Order fetched.'));
});


// PATCH /api/vendor/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}`);
    const transitionMap = {
        pending: ['pending', 'processing', 'cancelled'],
        processing: ['processing', 'shipped', 'cancelled'],
        shipped: ['shipped', 'delivered'],
        delivered: ['delivered'],
        cancelled: ['cancelled'],
    };

    const { id } = req.params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);

    const Order = mongoose.model('Order');
    const Product = mongoose.model('Product');
    const Commission = mongoose.model('Commission');

    const order = await Order.findOne({
        $or: [
            { orderId: id },
            ...(isUuid || isObjectId ? [{ _id: id }] : [])
        ],
        "vendorItems.vendorId": req.user.id
    });
    if (!order) throw new ApiError(404, 'Order not found.');

    let vendorItemsArray = Array.isArray(order.vendorItems) ? order.vendorItems : [];
    const vendorItem = vendorItemsArray.find((vi) => String(vi.vendorId) === String(req.user.id));
    if (!vendorItem) throw new ApiError(404, 'Vendor order item not found.');

    const currentStatus = String(vendorItem.status || 'pending');
    const allowedNextStatuses = transitionMap[currentStatus] || [];
    if (!allowedNextStatuses.includes(status)) {
        throw new ApiError(409, `Cannot move order from ${currentStatus} to ${status}.`);
    }

    const updatedVendorItems = vendorItemsArray.map((vi) => {
        const viObj = vi && typeof vi.toObject === 'function' ? vi.toObject() : { ...vi };
        return String(viObj.vendorId) === String(req.user.id) ? { ...viObj, status } : viObj;
    });
    const newTopLevelStatus = deriveTopLevelOrderStatus(updatedVendorItems, order.status);

    await runInTransaction(async (session) => {
        if (status === 'cancelled' && currentStatus !== 'cancelled') {
            const orderItems = Array.isArray(order.items) ? order.items : [];
            const vendorScopedItems = orderItems.filter((item) => String(item?.vendorId) === String(req.user.id));

            for (const item of vendorScopedItems) {
                const quantity = Number(item.quantity || 0);
                if (quantity <= 0) continue;

                const productQuery = Product.findOne({ _id: item.productId });
                if (session) productQuery.session(session);
                const product = await productQuery;
                if (!product) continue;

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
                const productSaveOptions = session ? { session } : {};
                await product.save(productSaveOptions);
            }

            const CommissionModel = mongoose.model('Commission');
            const commissionQuery = CommissionModel.updateMany(
                {
                    orderId: order._id,
                    vendorId: req.user.id,
                    status: { $ne: 'cancelled' }
                },
                {
                    $set: {
                        status: 'cancelled',
                        paidAt: null,
                        settlementId: null
                    }
                }
            );
            if (session) commissionQuery.session(session);
            await commissionQuery;
        }

        order.vendorItems = updatedVendorItems;
        const wasAlreadyCancelled = String(order.status || '').toLowerCase() === 'cancelled';
        order.status = newTopLevelStatus;
        if (newTopLevelStatus === 'cancelled' && !wasAlreadyCancelled) {
            order.cancelledAt = new Date();
        }
        const saveOptions = session ? { session } : {};
        await order.save(saveOptions);
    });

    const notificationTasks = [];
    if (order.userId) {
        notificationTasks.push(
            createNotification({
                recipientId: order.userId,
                recipientType: 'user',
                title: 'Order item status updated',
                message: `An item in your order ${order.orderId || order._id} is now ${status}.`,
                type: 'order',
                data: {
                    orderId: String(order.orderId || order._id),
                    status: String(status),
                    scope: 'vendor_item',
                },
            })
        );
    }

    notificationTasks.push(
        createNotification({
            recipientId: req.user.id,
            recipientType: 'vendor',
            title: 'Order status updated',
            message: `Order ${order.orderId || order._id} moved to ${status}.`,
            type: 'order',
            data: {
                orderId: String(order.orderId || order._id),
                status: String(status),
            },
        })
    );

    await Promise.allSettled(notificationTasks);

    res.status(200).json(new ApiResponse(200, { ...order.toObject(), id: String(order._id), vendorItems: updatedVendorItems, status: newTopLevelStatus }, 'Order status updated.'));
});

// GET /api/vendor/earnings
export const getEarnings = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        settlementsPage = 1,
        settlementsLimit = 50,
    } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 50);
    const commissionSkip = (numericPage - 1) * numericLimit;
    const numericSettlementsPage = Math.max(1, Number(settlementsPage) || 1);
    const numericSettlementsLimit = Math.max(1, Number(settlementsLimit) || 50);
    const settlementSkip = (numericSettlementsPage - 1) * numericSettlementsLimit;

    const Commission = mongoose.model('Commission');
    const Settlement = mongoose.model('Settlement');
    const Order = mongoose.model('Order');

    const [commissionDocs, totalCommissions, settlements, totalSettlements] = await Promise.all([
        Commission.find({ vendorId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(commissionSkip)
            .limit(numericLimit)
            .lean(),
        Commission.countDocuments({ vendorId: req.user.id }),
        Settlement.find({ vendorId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(settlementSkip)
            .limit(numericSettlementsLimit)
            .lean(),
        Settlement.countDocuments({ vendorId: req.user.id })
    ]);

    const allCommissionsForSummary = await Commission.find({ vendorId: req.user.id }).lean();

    const orderIds = [...new Set([
        ...commissionDocs.map(c => c.orderId).filter(Boolean),
        ...allCommissionsForSummary.map(c => c.orderId).filter(Boolean)
    ])];

    const orders = await Order.find({ _id: { $in: orderIds } }).select('orderId status').lean();

    const commissions = commissionDocs.map((commission) => {
        const orderRef = commission.orderId;
        const order = orders.find(o => String(o._id) === String(orderRef));
        const orderDisplayId = order?.orderId || String(orderRef || '');
        const orderStatus = String(order?.status || '').toLowerCase();

        let effectiveStatus;
        if (orderStatus === 'cancelled') {
            effectiveStatus = 'cancelled';
        } else if (orderStatus === 'delivered' && String(commission.status || 'pending') !== 'paid') {
            effectiveStatus = 'paid';
        } else {
            effectiveStatus = String(commission.status || 'pending');
        }

        return {
            ...commission,
            id: String(commission._id),
            orderRef,
            orderDisplayId,
            effectiveStatus,
        };
    });

    const summary = allCommissionsForSummary.reduce((acc, c) => {
        const order = orders.find(o => String(o._id) === String(c.orderId));
        const status = String(c.status || 'pending');
        const orderStatus = String(order?.status || '').toLowerCase();

        // Derive the effective status from both the order status and commission status:
        // - cancelled order  → commission is cancelled regardless
        // - delivered order  → earnings are realised (treat as 'paid' if not already explicitly paid)
        // - everything else  → use the commission's own status
        let effectiveStatus;
        if (orderStatus === 'cancelled') {
            effectiveStatus = 'cancelled';
        } else if (orderStatus === 'delivered' && status !== 'paid') {
            effectiveStatus = 'paid';
        } else {
            effectiveStatus = status;
        }

        const earnings = Number(c.vendorEarnings || 0);
        const commissionAmount = Number(c.commission || 0);

        if (effectiveStatus !== 'cancelled') {
            acc.totalEarnings += earnings;
            acc.totalCommission += commissionAmount;
            acc.totalOrders += 1;
        }

        if (effectiveStatus === 'pending') acc.pendingEarnings += earnings;
        if (effectiveStatus === 'paid') acc.paidEarnings += earnings;
        if (effectiveStatus === 'cancelled') acc.cancelledEarnings += earnings;
        return acc;
    }, {
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        cancelledEarnings: 0,
        totalCommission: 0,
        totalOrders: 0
    });


    res.status(200).json(
        new ApiResponse(
            200,
            {
                summary,
                commissions,
                settlements: settlements.map(s => ({ ...s, id: String(s._id) })),
                pagination: {
                    totalCommissions,
                    page: numericPage,
                    limit: numericLimit,
                    pages: Math.max(1, Math.ceil(totalCommissions / numericLimit)),
                },
                settlementsPagination: {
                    totalSettlements,
                    page: numericSettlementsPage,
                    limit: numericSettlementsLimit,
                    pages: Math.max(1, Math.ceil(totalSettlements / numericSettlementsLimit)),
                },
            },
            'Earnings fetched.'
        )
    );
});
