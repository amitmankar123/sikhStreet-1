import { runInTransaction } from '../../../utils/transaction.js';
import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { applyCampaignDiscountsToProducts } from '../../../utils/campaignPriceResolver.js';
import { generateOrderId } from '../../../utils/generateOrderId.js';
import { generateTrackingNumber } from '../../../utils/generateTrackingNumber.js';
import { createNotification } from '../../../services/notification.service.js';
import { calculateVendorShippingForGroups } from '../../../services/vendorShipping.service.js';

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

const resolveVariantSelection = (product, selectedVariant) => {
    const basePrice = Number(product?.price);
    if (!Number.isFinite(basePrice)) {
        throw new ApiError(400, `Invalid price configured for product ${product?.name || product?.id || ''}.`);
    }

    const entries = toVariantPriceEntries(product?.variants?.prices);
    const attributeAxes = Array.isArray(product?.variants?.attributes)
        ? product.variants.attributes
            .map((attr) => ({
                axisKey: normalizeAxisName(attr?.name),
                values: Array.isArray(attr?.values) ? attr.values : [],
            }))
            .filter((attr) => attr.axisKey && attr.values.length > 0)
        : [];
    const hasDynamicAxes = attributeAxes.length > 0;

    if (hasDynamicAxes) {
        const normalizedSelection = {};
        Object.entries(selectedVariant || {}).forEach(([axis, value]) => {
            const axisKey = normalizeAxisName(axis);
            const selectedValue = String(value || '').trim();
            if (axisKey && selectedValue) normalizedSelection[axisKey] = selectedValue;
        });

        const missingAxis = attributeAxes.find((attr) => !String(normalizedSelection[attr.axisKey] || '').trim());
        if (missingAxis) {
            throw new ApiError(400, `Please select ${missingAxis.axisKey.replace(/_/g, ' ')} for ${product?.name || 'product'}.`);
        }

        const selectionKey = createDynamicVariantKey(normalizedSelection);
        if (!selectionKey) {
            throw new ApiError(400, `Please select a variant for ${product?.name || 'product'}.`);
        }
        if (!entries.length) {
            return { price: basePrice, variantKey: selectionKey, hasVariantAxes: true };
        }

        const exact = entries.find(([rawKey]) => String(rawKey).trim() === selectionKey);
        if (exact) {
            const price = Number(exact[1]);
            if (Number.isFinite(price) && price >= 0) {
                return { price, variantKey: String(exact[0]).trim(), hasVariantAxes: true };
            }
        }
        const normalized = entries.find(
            ([rawKey]) => normalizeVariantPart(rawKey) === normalizeVariantPart(selectionKey)
        );
        if (normalized) {
            const price = Number(normalized[1]);
            if (Number.isFinite(price) && price >= 0) {
                return { price, variantKey: String(normalized[0]).trim(), hasVariantAxes: true };
            }
        }
        throw new ApiError(400, `Selected variant is not available for ${product?.name || 'product'}.`);
    }

    const sizes = Array.isArray(product?.variants?.sizes) ? product.variants.sizes : [];
    const colors = Array.isArray(product?.variants?.colors) ? product.variants.colors : [];
    const hasVariantAxes = sizes.length > 0 || colors.length > 0;

    const size = normalizeVariantPart(selectedVariant?.size);
    const color = normalizeVariantPart(selectedVariant?.color);
    if (hasVariantAxes && !size && !color) {
        throw new ApiError(400, `Please select a variant for ${product?.name || 'product'}.`);
    }
    if (!entries.length || (!size && !color)) {
        return { price: basePrice, variantKey: null, hasVariantAxes };
    }

    const candidateKeys = [
        `${size}|${color}`,
        `${size}-${color}`,
        `${size}_${color}`,
        `${size}:${color}`,
        size && !color ? size : null,
        color && !size ? color : null,
    ].filter(Boolean);

    for (const candidate of candidateKeys) {
        const exact = entries.find(([rawKey]) => String(rawKey).trim() === candidate);
        if (exact) {
            const price = Number(exact[1]);
            if (Number.isFinite(price) && price >= 0) {
                return { price, variantKey: String(exact[0]).trim(), hasVariantAxes };
            }
        }

        const normalized = entries.find(
            ([rawKey]) => normalizeVariantPart(rawKey) === normalizeVariantPart(candidate)
        );
        if (normalized) {
            const price = Number(normalized[1]);
            if (Number.isFinite(price) && price >= 0) {
                return { price, variantKey: String(normalized[0]).trim(), hasVariantAxes };
            }
        }
    }

    if (hasVariantAxes) {
        throw new ApiError(400, `Selected variant is not available for ${product?.name || 'product'}.`);
    }
    return { price: basePrice, variantKey: null, hasVariantAxes };
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

// POST /api/user/orders/validate-stock
export const validateStock = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Vendor = mongoose.model('Vendor');
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, 'Your cart is empty.');
    }

    for (const item of items) {
        let product = await Product.findOne({ _id: item.productId || item.id }).lean();
        if (!product) {
            throw new ApiError(404, `Product not found: ${item.productId || item.id}`);
        }
        const discounted = await applyCampaignDiscountsToProducts([product]);
        product = discounted[0];
        const vendor = await Vendor.findOne({ _id: product.vendorId }).lean();
        if (!vendor || vendor.status === 'suspended') {
            throw new ApiError(404, `Product not found or vendor is not active: ${item.productId || item.id}`);
        }
        if (product.stock === 'out_of_stock') {
            throw new ApiError(400, `${product.name} is out of stock.`);
        }
        if (product.stockQuantity < item.quantity) {
            throw new ApiError(400, `Only ${product.stockQuantity} units of ${product.name} available.`);
        }

        const { variantKey } = resolveVariantSelection(product, item.variant);
        const hasSpecificVariantStock = variantKey && product?.variants?.stockMap && product.variants.stockMap[variantKey] !== undefined;
        const variantStockValue = hasSpecificVariantStock ? Number(product.variants.stockMap[variantKey]) : null;
        const effectiveStock = variantStockValue !== null ? variantStockValue : product.stockQuantity;

        if (effectiveStock < item.quantity) {
            throw new ApiError(400, `Only ${effectiveStock} units available for selected variant of ${product.name}.`);
        }
    }

    res.status(200).json(new ApiResponse(200, { success: true }, 'Stock validation passed.'));
});

// POST /api/user/orders
export const placeOrder = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');
    const Vendor = mongoose.model('Vendor');
    const Coupon = mongoose.model('Coupon');
    const Order = mongoose.model('Order');
    const Commission = mongoose.model('Commission');

    const { items, shippingAddress, paymentMethod, couponCode, shippingOption } = req.body;
    const normalizedPaymentMethod = paymentMethod === 'cash' ? 'cod' : paymentMethod;
    const userId = req.user?.id || null;
    const rawIdempotencyKey = String(req.get('x-idempotency-key') || '').trim();
    const idempotencyKey = rawIdempotencyKey || null;
    const normalizedGuestEmail = String(shippingAddress?.email || '').trim().toLowerCase();
    const normalizedGuestPhone = String(shippingAddress?.phone || '').replace(/\D/g, '').slice(-10);
    const idempotencyScope = userId
        ? `user:${String(userId)}`
        : `guest:${normalizedGuestEmail || normalizedGuestPhone || 'anonymous'}`;

    if (idempotencyKey) {
        const existingOrder = await Order.findOne({ idempotencyScope, idempotencyKey }).select('orderId total trackingNumber').lean();
        if (existingOrder) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        orderId: existingOrder.orderId,
                        total: existingOrder.total,
                        trackingNumber: existingOrder.trackingNumber,
                        idempotentReplay: true,
                    },
                    'Duplicate order request ignored. Returning existing order.'
                )
            );
        }
    }

    // 1. Validate items and calculate subtotal
    let subtotal = 0;
    const enrichedItems = [];
    const vendorMap = {};

    for (const item of items) {
        let product = await Product.findOne({ _id: item.productId }).lean();
        if (!product) {
            throw new ApiError(404, `Product not found: ${item.productId}`);
        }
        const discounted = await applyCampaignDiscountsToProducts([product]);
        product = discounted[0];
        const vendor = await Vendor.findOne({ _id: product.vendorId }).lean();
        if (!vendor || vendor.status === 'suspended') {
            throw new ApiError(404, `Product not found or vendor is not active: ${item.productId}`);
        }
        if (product.stock === 'out_of_stock') throw new ApiError(400, `${product.name} is out of stock.`);
        if (product.stockQuantity < item.quantity) throw new ApiError(400, `Only ${product.stockQuantity} units of ${product.name} available.`);

        const { price: itemPrice, variantKey, hasVariantAxes } = resolveVariantSelection(product, item.variant);
        const hasSpecificVariantStock = variantKey && product?.variants?.stockMap && product.variants.stockMap[variantKey] !== undefined;
        const variantStockValue = hasSpecificVariantStock ? Number(product.variants.stockMap[variantKey]) : null;
        const effectiveStock = variantStockValue !== null ? variantStockValue : product.stockQuantity;

        if (effectiveStock < item.quantity) {
            throw new ApiError(400, `Only ${effectiveStock} units available for selected variant of ${product.name}.`);
        }
        const itemSubtotal = itemPrice * item.quantity;
        subtotal += itemSubtotal;

        const variantImage = variantKey && product?.variants && typeof product.variants === 'object'
            ? String(product.variants.imageMap?.[variantKey] || '').trim()
            : '';
        const enriched = {
            productId: product._id,
            vendorId: vendor._id,
            name: product.name,
            image: variantImage || product.image,
            price: itemPrice,
            quantity: item.quantity,
            variant: item.variant,
            variantKey: variantKey || undefined,
        };
        enrichedItems.push(enriched);

        const vid = String(vendor._id);
        if (!vendorMap[vid]) {
            vendorMap[vid] = {
                vendorId: vendor._id,
                vendorName: vendor.storeName || vendor.name,
                commissionRate: vendor.commissionRate ?? 10,
                shippingEnabled: vendor.shippingEnabled !== false,
                defaultShippingRate: vendor.defaultShippingRate,
                freeShippingThreshold: vendor.freeShippingThreshold,
                items: [],
                subtotal: 0,
            };
        }
        vendorMap[vid].items.push(enriched);
        vendorMap[vid].subtotal += itemSubtotal;
    }

    // 2. Validate coupon
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (!coupon) throw new ApiError(400, 'Invalid coupon code.');
        if (coupon.startsAt && coupon.startsAt > new Date()) throw new ApiError(400, 'Coupon is not active yet.');
        if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'Coupon has expired.');
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached.');
        if (subtotal < coupon.minOrderValue) throw new ApiError(400, `Minimum order value for this coupon is Rs.${coupon.minOrderValue}.`);

        if (coupon.type === 'percentage') {
            couponDiscount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
        } else if (coupon.type === 'fixed') {
            couponDiscount = coupon.value;
        }
        couponDiscount = Math.min(couponDiscount, subtotal);
        appliedCoupon = coupon;
    }

    // 3. Calculate shipping
    const vendorShippingInput = Object.values(vendorMap).map((vendorGroup) => ({
        vendorId: vendorGroup.vendorId,
        subtotal: vendorGroup.subtotal,
        shippingEnabled: vendorGroup.shippingEnabled,
        defaultShippingRate: vendorGroup.defaultShippingRate,
        freeShippingThreshold: vendorGroup.freeShippingThreshold,
    }));
    const { totalShipping: shipping, shippingByVendor } = await calculateVendorShippingForGroups({
        vendorGroups: vendorShippingInput,
        shippingAddress,
        shippingOption,
        couponType: appliedCoupon?.type || null,
    });

    // 4. Calculate tax (18%)
    const taxableAmount = Math.max(0, subtotal - couponDiscount);
    const tax = parseFloat((taxableAmount * 0.18).toFixed(2));
    const total = parseFloat(Math.max(0, taxableAmount + shipping + tax).toFixed(2));

    // 5. Build vendor item groups with proportional discount and tax
    const vendorItems = Object.values(vendorMap).map((v) => {
        const vendorShare = subtotal > 0 ? (v.subtotal / subtotal) : 0;
        const vendorDiscount = Math.min(v.subtotal, parseFloat((couponDiscount * vendorShare).toFixed(2)));
        const vendorSubtotalAfterDiscount = Math.max(0, v.subtotal - vendorDiscount);
        const vendorTax = parseFloat((vendorSubtotalAfterDiscount * 0.18).toFixed(2));

        return {
            vendorId: v.vendorId,
            vendorName: v.vendorName,
            items: v.items,
            subtotal: v.subtotal,
            shipping: Number(shippingByVendor[String(v.vendorId)] || 0),
            tax: vendorTax,
            discount: vendorDiscount,
            status: 'pending',
        };
    });

    // 6. Mongoose transaction for atomic checkout updates
    let order = null;
    let idempotentReplay = false;

    try {
        await runInTransaction(async (session) => {
            if (idempotencyKey) {
                const existingOrder = await Order.findOne({ idempotencyScope, idempotencyKey }).session(session);
                if (existingOrder) {
                    idempotentReplay = true;
                    order = existingOrder;
                    return;
                }
            }

            const createdOrder = await Order.create([{
                orderId: generateOrderId(),
                userId,
                items: enrichedItems,
                vendorItems,
                shippingAddress,
                paymentMethod: normalizedPaymentMethod,
                paymentStatus: 'pending',
                subtotal,
                shipping,
                tax,
                discount: couponDiscount,
                total,
                couponCode: couponCode?.toUpperCase(),
                couponDiscount,
                trackingNumber: generateTrackingNumber(),
                estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                idempotencyKey,
                idempotencyScope: idempotencyKey ? idempotencyScope : null,
            }], { session });

            order = createdOrder[0];

            // 7. Deduct stock atomically
            for (const item of enrichedItems) {
                const product = await Product.findOne({ _id: item.productId }).session(session);
                if (!product) throw new ApiError(404, `Product not found: ${item.productId}`);
                if (product.stockQuantity < item.quantity) {
                    throw new ApiError(409, `Insufficient stock for ${item.name}.`);
                }

                const newStockQty = product.stockQuantity - item.quantity;
                const nextStockState = newStockQty <= 0
                    ? 'out_of_stock'
                    : (newStockQty <= product.lowStockThreshold ? 'low_stock' : 'in_stock');

                let updatedVariants = product.variants;
                const hasSpecificVariantStock = item.variantKey && product.variants && typeof product.variants === 'object' && product.variants.stockMap && product.variants.stockMap[item.variantKey] !== undefined;

                if (hasSpecificVariantStock) {
                    const variantsObj = { ...product.variants };
                    const stockMapObj = { ...variantsObj.stockMap };
                    const oldVal = Number(stockMapObj[item.variantKey]);
                    if (oldVal < item.quantity) {
                        throw new ApiError(409, `Insufficient variant stock for ${item.name}.`);
                    }
                    stockMapObj[item.variantKey] = oldVal - item.quantity;
                    variantsObj.stockMap = stockMapObj;
                    updatedVariants = variantsObj;
                }

                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            stockQuantity: newStockQty,
                            stock: nextStockState,
                            variants: updatedVariants
                        }
                    }
                ).session(session);
            }

            // 8. Record commissions
            const commissionDocs = Object.values(vendorMap).map((v) => ({
                orderId: order._id,
                vendorId: v.vendorId,
                vendorName: v.vendorName,
                subtotal: v.subtotal,
                commissionRate: v.commissionRate,
                commission: parseFloat(((v.subtotal * v.commissionRate) / 100).toFixed(2)),
                vendorEarnings: parseFloat((v.subtotal - (v.subtotal * v.commissionRate) / 100).toFixed(2)),
                status: 'pending',
            }));
            await Commission.create(commissionDocs, { session });

            // 9. Increment coupon usage
            if (appliedCoupon) {
                await Coupon.updateOne(
                    { _id: appliedCoupon._id },
                    { $inc: { usedCount: 1 } }
                ).session(session);
            }
        });
    } catch (err) {
        if (idempotencyKey && (err.code === 11000 || err.message?.includes('duplicate key'))) {
            const existingOrder = await Order.findOne({ idempotencyScope, idempotencyKey }).select('orderId total trackingNumber').lean();
            if (existingOrder) {
                order = existingOrder;
                idempotentReplay = true;
            } else {
                throw err;
            }
        } else {
            throw err;
        }
    }

    const responseStatus = idempotentReplay ? 200 : 201;
    const responseMessage = idempotentReplay
        ? 'Duplicate order request ignored. Returning existing order.'
        : 'Order placed successfully.';
    res.status(responseStatus).json(
        new ApiResponse(
            responseStatus,
            {
                orderId: order.orderId,
                total: order.total,
                trackingNumber: order.trackingNumber,
                ...(idempotentReplay ? { idempotentReplay: true } : {}),
            },
            responseMessage
        )
    );
});

// GET /api/user/orders
export const getUserOrders = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const { page = 1, limit = 10 } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 10);
    const skip = (numericPage - 1) * numericLimit;

    const orders = await Order.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean();

    const total = await Order.countDocuments({ userId: req.user.id });
    res.status(200).json(new ApiResponse(200, { orders, total, page: numericPage, pages: Math.ceil(total / numericLimit) }, 'Orders fetched.'));
});

// GET /api/user/orders/:id
export const getOrderDetail = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(req.params.id);

    const query = { userId: req.user.id };
    if (isUuid) {
        query.$or = [{ orderId: req.params.id }, { _id: req.params.id }];
    } else {
        query.orderId = req.params.id;
    }

    const order = await Order.findOne(query).lean();
    if (!order) throw new ApiError(404, 'Order not found.');
    res.status(200).json(new ApiResponse(200, { ...order, id: order._id }, 'Order detail fetched.'));
});

// PATCH /api/user/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const Product = mongoose.model('Product');
    const Commission = mongoose.model('Commission');

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(req.params.id);
    const query = { userId: req.user.id };
    if (isUuid) {
        query.$or = [{ orderId: req.params.id }, { _id: req.params.id }];
    } else {
        query.orderId = req.params.id;
    }

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const order = await Order.findOne(query).session(session);
            if (!order) throw new ApiError(404, 'Order not found.');
            if (!['pending', 'processing'].includes(order.status)) throw new ApiError(400, 'Order cannot be cancelled at this stage.');

            let updatedVendorItems = order.vendorItems;
            if (Array.isArray(order.vendorItems)) {
                updatedVendorItems = order.vendorItems.map((vendorGroup) => ({
                    ...vendorGroup,
                    status: 'cancelled',
                }));
            }

            order.status = 'cancelled';
            order.cancelledAt = new Date();
            order.cancellationReason = req.body.reason || 'Cancelled by customer';
            order.vendorItems = updatedVendorItems;
            await order.save({ session });

            // Restore stock
            const items = Array.isArray(order.items) ? order.items : [];
            for (const item of items) {
                const quantity = Number(item.quantity || 0);
                if (quantity <= 0) continue;

                const product = await Product.findOne({ _id: item.productId }).session(session);
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

                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            stockQuantity: newStockQty,
                            stock: nextStockState,
                            variants: updatedVariants
                        }
                    }
                ).session(session);
            }

            // Reverse vendor earnings visibility
            await Commission.updateMany(
                { orderId: order._id, status: { $ne: 'cancelled' } },
                { $set: { status: 'cancelled', paidAt: null, settlementId: null } }
            ).session(session);
        });
    } finally {
        session.endSession();
    }

    res.status(200).json(new ApiResponse(200, null, 'Order cancelled successfully.'));
});

const normalizeReturnRequest = (requestDoc) => {
    if (!requestDoc) return null;
    const orderId = requestDoc?.order?.orderId || '';
    const orderRefId = requestDoc?.orderId || null;
    return {
        ...requestDoc,
        id: requestDoc.id || requestDoc._id,
        orderId: orderId || String(orderRefId || ''),
        orderRefId: orderRefId ? String(orderRefId) : null,
        requestDate: requestDoc.createdAt,
    };
};

// POST /api/user/orders/:id/returns
export const createReturnRequest = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const ReturnRequest = mongoose.model('ReturnRequest');
    const Admin = mongoose.model('Admin');

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(req.params.id);
    const query = { userId: req.user.id };
    if (isUuid) {
        query.$or = [{ orderId: req.params.id }, { _id: req.params.id }];
    } else {
        query.orderId = req.params.id;
    }

    const order = await Order.findOne(query).lean();
    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.status !== 'delivered') {
        throw new ApiError(400, 'Return can only be requested for delivered orders.');
    }

    const requestedVendorId = String(req.body.vendorId || '').trim();
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const orderVendorIds = [...new Set(orderItems.map((item) => String(item?.vendorId || '')).filter(Boolean))];

    let vendorId = requestedVendorId;
    if (!vendorId) {
        if (orderVendorIds.length > 1) {
            throw new ApiError(400, 'vendorId is required for multi-vendor orders.');
        }
        vendorId = orderVendorIds[0] || '';
    }
    if (!vendorId) {
        throw new ApiError(400, 'Unable to resolve vendor for return request.');
    }

    const vendorScopedItems = orderItems.filter((item) => String(item?.vendorId || '') === vendorId);
    if (vendorScopedItems.length === 0) {
        throw new ApiError(400, 'Selected vendor has no items in this order.');
    }

    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    let normalizedItems = [];

    if (requestedItems.length > 0) {
        normalizedItems = requestedItems.map((inputItem) => {
            const productId = String(inputItem?.productId || '');
            const orderItem = vendorScopedItems.find((it) => String(it?.productId || '') === productId);
            if (!orderItem) {
                throw new ApiError(400, `Product ${productId} is not valid for this return request.`);
            }

            const requestedQty = Number(inputItem?.quantity || 0);
            const maxQty = Number(orderItem?.quantity || 0);
            if (!Number.isFinite(requestedQty) || requestedQty <= 0 || requestedQty > maxQty) {
                throw new ApiError(400, `Invalid quantity for product ${orderItem.name || productId}.`);
            }

            return {
                productId: orderItem.productId,
                name: orderItem.name,
                quantity: requestedQty,
                reason: String(inputItem?.reason || req.body.reason || '').trim(),
            };
        });
    } else {
        normalizedItems = vendorScopedItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: Number(item.quantity || 1),
            reason: String(req.body.reason || '').trim(),
        }));
    }

    const existingOpen = await ReturnRequest.findOne({
        orderId: order._id,
        userId: req.user.id,
        vendorId,
        status: { $in: ['pending', 'approved', 'processing'] },
    }).lean();
    if (existingOpen) {
        throw new ApiError(409, 'An active return request already exists for this vendor in the selected order.');
    }

    const refundAmount = normalizedItems.reduce((sum, item) => {
        const orderItem = vendorScopedItems.find((it) => String(it?.productId || '') === String(item.productId || ''));
        const unitPrice = Number(orderItem?.price || 0);
        return sum + unitPrice * Number(item.quantity || 0);
    }, 0);

    const request = await ReturnRequest.create({
        orderId: order._id,
        userId: req.user.id,
        vendorId,
        items: normalizedItems,
        reason: String(req.body.reason || '').trim(),
        status: 'pending',
        refundAmount: Number(refundAmount.toFixed(2)),
        refundStatus: 'pending',
        images: Array.isArray(req.body.images) ? req.body.images : [],
    });

    const admins = await Admin.find({ isActive: true }).select('_id').lean();

    await Promise.all(
        admins.map((admin) =>
            createNotification({
                recipientId: String(admin._id),
                recipientType: 'admin',
                title: 'New Return Request',
                message: `Order ${order.orderId} has a new return request awaiting review.`,
                type: 'order',
                data: {
                    returnRequestId: String(request._id),
                    orderId: String(order.orderId),
                    vendorId: String(vendorId),
                },
            })
        )
    );

    await createNotification({
        recipientId: vendorId,
        recipientType: 'vendor',
        title: 'New Return Request',
        message: `Order ${order.orderId} has a return request from customer.`,
        type: 'order',
        data: {
            returnRequestId: String(request._id),
            orderId: String(order.orderId),
        },
    });

    const Vendor = mongoose.model('Vendor');
    const populatedOrder = await Order.findOne({ _id: order._id }).select('orderId total createdAt').lean();
    const populatedVendor = await Vendor.findOne({ _id: vendorId }).select('storeName email').lean();

    const populatedRequest = {
        ...request.toObject(),
        order: populatedOrder,
        vendor: populatedVendor,
    };

    res.status(201).json(new ApiResponse(201, normalizeReturnRequest(populatedRequest), 'Return request submitted successfully.'));
});

// GET /api/user/returns
export const getUserReturnRequests = asyncHandler(async (req, res) => {
    const ReturnRequest = mongoose.model('ReturnRequest');
    const Order = mongoose.model('Order');
    const Vendor = mongoose.model('Vendor');

    const { page = 1, limit = 20, status } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 20);
    const skip = (numericPage - 1) * numericLimit;
    const filter = { userId: req.user.id };
    if (status && status !== 'all') filter.status = status;

    const [requests, total] = await Promise.all([
        ReturnRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        ReturnRequest.countDocuments(filter),
    ]);

    const orderIds = [...new Set(requests.map(r => r.orderId).filter(Boolean))];
    const vendorIds = [...new Set(requests.map(r => r.vendorId).filter(Boolean))];

    const [orders, vendors] = await Promise.all([
        Order.find({ _id: { $in: orderIds } }).select('orderId total createdAt').lean(),
        Vendor.find({ _id: { $in: vendorIds } }).select('storeName email').lean()
    ]);

    const populatedRequests = requests.map(r => {
        const order = orders.find(o => String(o._id) === String(r.orderId));
        const vendor = vendors.find(v => String(v._id) === String(r.vendorId));
        return normalizeReturnRequest({
            ...r,
            order,
            vendor
        });
    });

    res.status(200).json(new ApiResponse(200, {
        returnRequests: populatedRequests,
        pagination: {
            total,
            page: numericPage,
            limit: numericLimit,
            pages: Math.ceil(total / numericLimit),
        },
    }, 'Return requests fetched.'));
});

// GET /api/user/returns/:id
export const getUserReturnRequestById = asyncHandler(async (req, res) => {
    const ReturnRequest = mongoose.model('ReturnRequest');
    const Order = mongoose.model('Order');
    const Vendor = mongoose.model('Vendor');

    const request = await ReturnRequest.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!request) throw new ApiError(404, 'Return request not found.');

    const [order, vendor] = await Promise.all([
        Order.findOne({ _id: request.orderId }).select('orderId total createdAt').lean(),
        Vendor.findOne({ _id: request.vendorId }).select('storeName email').lean()
    ]);

    const populated = {
        ...request,
        order,
        vendor
    };

    res.status(200).json(new ApiResponse(200, normalizeReturnRequest(populated), 'Return request fetched.'));
});
