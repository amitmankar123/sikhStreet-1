import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

// GET /api/admin/notifications
export const getAdminNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const Notification = mongoose.model('Notification');

    const filter = {
        $or: [
            { recipientType: 'admin' },
            { recipientId: req.user.id, recipientType: 'admin' }
        ]
    };

    if (type) {
        filter.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({
            ...filter,
            isRead: false
        })
    ]);

    const mapped = notifications.map(n => ({ ...n, id: String(n._id) }));

    res.status(200).json(new ApiResponse(200, {
        notifications: mapped,
        total,
        unreadCount,
        page: numericPage,
        pages: Math.ceil(total / numericLimit)
    }, 'Notifications fetched.'));
});

// PUT /api/admin/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const Notification = mongoose.model('Notification');

    const notification = await Notification.findOneAndUpdate(
        { _id: id },
        { $set: { isRead: true } },
        { new: true }
    ).lean();

    if (!notification) {
        throw new ApiError(404, 'Notification not found.');
    }

    res.status(200).json(new ApiResponse(200, { ...notification, id: String(notification._id) }, 'Notification marked as read.'));
});

// PUT /api/admin/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
    const Notification = mongoose.model('Notification');

    const filter = {
        $or: [
            { recipientType: 'admin' },
            { recipientId: req.user.id, recipientType: 'admin' }
        ],
        isRead: false
    };

    await Notification.updateMany(filter, { $set: { isRead: true } });

    res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read.'));
});
