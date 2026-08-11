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

// GET /api/vendor/chat/threads
// Returns order threads (auto-created from orders) AND general threads (created by customers).
// These are kept fully separate: only 'order' type threads are auto-created here.
export const getVendorChatThreads = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const Order = mongoose.model('Order');
    const VendorChatThread = mongoose.model('VendorChatThread');
    const User = mongoose.model('User');

    // ── Auto-create order threads for recent orders (only 'order' type) ──
    const recentOrders = await Order.find({
        'vendorItems.vendorId': vendorId
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

    const userIds = [...new Set(recentOrders.map(o => o.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email phone').lean();

    for (const order of recentOrders) {
        if (order.userId) {
            order.user = users.find(u => String(u._id) === String(order.userId)) || null;
        }
        const seed = buildThreadSeedFromOrder(order);

        let existingThread = await VendorChatThread.findOne({
            vendorId,
            orderRef: order._id,
            threadType: 'order',
        });

        if (!existingThread) {
            await VendorChatThread.create({
                vendorId,
                orderRef: order._id,
                ...seed,
                threadType: 'order',
                lastMessage: 'Hello, I need help with my order',
                lastActivity: order.createdAt || new Date(),
                unreadCount: 0,
                customerUnreadCount: 0,
            });
        } else {
            existingThread.orderDisplayId = seed.orderDisplayId;
            existingThread.customerUserId = seed.customerUserId;
            existingThread.customerName = seed.customerName;
            existingThread.customerEmail = seed.customerEmail;
            existingThread.customerPhone = seed.customerPhone;
            await existingThread.save();
        }
    }

    // ── Fetch ALL threads for this vendor, separated by threadType ──
    const allThreads = await VendorChatThread.find({ vendorId })
        .sort({ lastActivity: -1 })
        .lean();

    const orderThreads = allThreads.filter(t => !t.threadType || t.threadType === 'order');
    const generalThreads = allThreads.filter(t => t.threadType === 'general');

    res.status(200).json(new ApiResponse(200, {
        orderThreads,
        generalThreads,
        // flat list still available for backward compat
        threads: allThreads,
    }, 'Chat threads fetched.'));
});

// GET /api/vendor/chat/threads/:id/messages
export const getVendorChatMessages = asyncHandler(async (req, res) => {
    const VendorChatThread = mongoose.model('VendorChatThread');
    const VendorChatMessage = mongoose.model('VendorChatMessage');

    const thread = await VendorChatThread.findOne({ _id: req.params.id, vendorId: req.user.id }).lean();
    if (!thread) throw new ApiError(404, 'Chat thread not found.');

    const messages = await VendorChatMessage.find({ threadId: thread._id })
        .sort({ createdAt: 1 })
        .lean();

    // For ORDER threads with no messages: auto-seed a greeting exchange
    // For GENERAL threads with no messages: return empty (customer hasn't spoken yet)
    if (messages.length === 0 && thread.threadType !== 'general') {
        const seeded = [
            await VendorChatMessage.create({
                threadId: thread._id,
                senderType: 'customer',
                senderId: thread.customerUserId || null,
                message: thread.lastMessage || 'Hello, I need help with my order',
            }),
            await VendorChatMessage.create({
                threadId: thread._id,
                senderType: 'vendor',
                senderId: req.user.id,
                message: 'Hi! How can I help you today?',
            })
        ];
        return res
            .status(200)
            .json(new ApiResponse(200, seeded.map(serializeMessage), 'Chat messages fetched.'));
    }

    res.status(200).json(new ApiResponse(200, messages.map(serializeMessage), 'Chat messages fetched.'));
});

// POST /api/vendor/chat/threads/:id/messages
export const sendVendorChatMessage = asyncHandler(async (req, res) => {
    const message = String(req.body?.message || '').trim();
    if (!message) throw new ApiError(400, 'Message is required.');

    const VendorChatThread = mongoose.model('VendorChatThread');
    const VendorChatMessage = mongoose.model('VendorChatMessage');

    const thread = await VendorChatThread.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!thread) throw new ApiError(404, 'Chat thread not found.');

    const created = await VendorChatMessage.create({
        threadId: thread._id,
        senderType: 'vendor',
        senderId: req.user.id,
        message,
    });

    thread.lastMessage = message;
    thread.lastActivity = created.createdAt;
    thread.customerUnreadCount = (thread.customerUnreadCount || 0) + 1;
    await thread.save();

    res.status(201).json(new ApiResponse(201, serializeMessage(created), 'Message sent.'));
});

// PATCH /api/vendor/chat/threads/:id/read
export const markVendorChatRead = asyncHandler(async (req, res) => {
    const VendorChatThread = mongoose.model('VendorChatThread');

    const thread = await VendorChatThread.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!thread) throw new ApiError(404, 'Chat thread not found.');

    thread.unreadCount = 0;
    if (thread.status !== 'resolved') {
        thread.status = 'active';
    }
    const updatedThread = await thread.save();

    res.status(200).json(new ApiResponse(200, updatedThread.toObject(), 'Chat marked as read.'));
});

// PATCH /api/vendor/chat/threads/:id/status
export const updateVendorChatStatus = asyncHandler(async (req, res) => {
    const status = String(req.body?.status || '').trim();
    if (!['active', 'resolved'].includes(status)) {
        throw new ApiError(400, 'Status must be active or resolved.');
    }

    const VendorChatThread = mongoose.model('VendorChatThread');

    const thread = await VendorChatThread.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!thread) throw new ApiError(404, 'Chat thread not found.');

    thread.status = status;
    const updatedThread = await thread.save();

    res.status(200).json(new ApiResponse(200, updatedThread.toObject(), 'Chat status updated.'));
});
