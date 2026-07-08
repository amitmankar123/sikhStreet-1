import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

const buildThreadSeedFromOrder = (order) => {
    const customerName =
        order?.shippingAddress?.name ||
        order?.guestInfo?.name ||
        order?.user?.name ||
        'Customer';
    const customerEmail =
        order?.shippingAddress?.email ||
        order?.guestInfo?.email ||
        order?.user?.email ||
        '';
    const customerPhone =
        order?.shippingAddress?.phone ||
        order?.guestInfo?.phone ||
        order?.user?.phone ||
        '';
    const orderDisplayId = order?.orderId || String(order?._id || order?.id || '');

    return {
        orderDisplayId,
        customerUserId: order?.userId || null,
        customerName,
        customerEmail,
        customerPhone,
        status: 'active',
    };
};

const serializeMessage = (messageDoc) => ({
    id: messageDoc.id || messageDoc._id,
    sender: messageDoc.senderType,
    message: messageDoc.message,
    time: messageDoc.createdAt,
});

// GET /api/user/chat/threads
export const getUserChatThreads = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const VendorChatThread = mongoose.model('VendorChatThread');

    const threads = await VendorChatThread.find({ customerUserId: userId })
        .sort({ lastActivity: -1 })
        .lean();

    res.status(200).json(new ApiResponse(200, threads, 'User chat threads fetched.'));
});

// GET /api/user/chat/threads/order/:orderId/vendor/:vendorId
export const getOrCreateUserChatThread = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { orderId, vendorId } = req.params;
    const VendorChatThread = mongoose.model('VendorChatThread');
    const Order = mongoose.model('Order');

    // Check if thread already exists
    let thread = await VendorChatThread.findOne({ customerUserId: userId, orderRef: orderId, vendorId }).lean();

    if (!thread) {
        // Fetch order details to verify and seed the thread
        const order = await Order.findOne({ _id: orderId }).lean();

        if (!order) {
            throw new ApiError(404, 'Order not found.');
        }

        // Verify ownership
        if (order.userId && String(order.userId) !== String(userId)) {
            throw new ApiError(403, 'You do not have permission to access this order.');
        }

        // Verify order contains items from the specified vendor
        const hasVendorItems = Array.isArray(order.vendorItems) && order.vendorItems.some(
            (group) => String(group.vendorId) === String(vendorId)
        );

        if (!hasVendorItems) {
            throw new ApiError(400, 'This order does not contain items from this seller.');
        }

        const seed = buildThreadSeedFromOrder(order);

        const created = await VendorChatThread.create({
            vendorId,
            orderRef: order._id,
            ...seed,
            lastMessage: 'Hello, I need help with my order',
            lastActivity: order.createdAt || new Date(),
            unreadCount: 0,
            customerUnreadCount: 0,
        });
        thread = created.toObject();
    }

    res.status(200).json(new ApiResponse(200, thread, 'Chat thread initialized.'));
});

// GET /api/user/chat/threads/:id/messages
export const getUserChatMessages = asyncHandler(async (req, res) => {
    const VendorChatThread = mongoose.model('VendorChatThread');
    const VendorChatMessage = mongoose.model('VendorChatMessage');

    const thread = await VendorChatThread.findOne({ _id: req.params.id, customerUserId: req.user.id }).lean();
    if (!thread) throw new ApiError(404, 'Chat thread not found.');

    const messages = await VendorChatMessage.find({ threadId: thread._id })
        .sort({ createdAt: 1 })
        .lean();

    if (messages.length === 0) {
        const seeded = [
            await VendorChatMessage.create({
                threadId: thread._id,
                senderType: 'customer',
                senderId: req.user.id,
                message: thread.lastMessage || 'Hello, I need help with my order',
            }),
            await VendorChatMessage.create({
                threadId: thread._id,
                senderType: 'vendor',
                senderId: thread.vendorId,
                message: 'Hi! How can I help you today?',
            })
        ];
        return res
            .status(200)
            .json(new ApiResponse(200, seeded.map(serializeMessage), 'Chat messages fetched.'));
    }

    res.status(200).json(new ApiResponse(200, messages.map(serializeMessage), 'Chat messages fetched.'));
});

// POST /api/user/chat/threads/:id/messages
export const sendUserChatMessage = asyncHandler(async (req, res) => {
    const message = String(req.body?.message || '').trim();
    if (!message) throw new ApiError(400, 'Message is required.');

    const VendorChatThread = mongoose.model('VendorChatThread');
    const VendorChatMessage = mongoose.model('VendorChatMessage');

    const thread = await VendorChatThread.findOne({ _id: req.params.id, customerUserId: req.user.id });
    if (!thread) throw new ApiError(404, 'Chat thread not found.');

    const created = await VendorChatMessage.create({
        threadId: thread._id,
        senderType: 'customer',
        senderId: req.user.id,
        message,
    });

    thread.lastMessage = message;
    thread.lastActivity = created.createdAt;
    thread.unreadCount = (thread.unreadCount || 0) + 1;
    thread.customerUnreadCount = 0;
    await thread.save();

    res.status(201).json(new ApiResponse(201, serializeMessage(created), 'Message sent.'));
});

// PATCH /api/user/chat/threads/:id/read
export const markUserChatRead = asyncHandler(async (req, res) => {
    const VendorChatThread = mongoose.model('VendorChatThread');

    const thread = await VendorChatThread.findOne({ _id: req.params.id, customerUserId: req.user.id });
    if (!thread) throw new ApiError(404, 'Chat thread not found.');

    thread.customerUnreadCount = 0;
    const updatedThread = await thread.save();

    res.status(200).json(new ApiResponse(200, updatedThread.toObject(), 'Chat marked as read.'));
});
