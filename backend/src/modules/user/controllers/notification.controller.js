import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

// GET /api/user/notifications
export const getUserNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 20);
    const skip = (numericPage - 1) * numericLimit;

    const Notification = mongoose.model('Notification');

    const filter = {
        recipientId: req.user.id,
        recipientType: 'user',
    };

    if (type && type !== 'all') {
        filter.type = type;
    }
    if (isRead === 'true') {
        filter.isRead = true;
    } else if (isRead === 'false') {
        filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({
            recipientId: req.user.id,
            recipientType: 'user',
            isRead: false,
        }),
    ]);

    const mapped = notifications.map(n => ({ ...n, id: String(n._id) }));

    res.status(200).json(
        new ApiResponse(
            200,
            {
                notifications: mapped,
                total,
                unreadCount,
                page: numericPage,
                pages: Math.ceil(total / numericLimit),
            },
            'User notifications fetched.'
        )
    );
});

// PUT /api/user/notifications/:id/read
export const markUserNotificationAsRead = asyncHandler(async (req, res) => {
    const Notification = mongoose.model('Notification');

    const notification = await Notification.findOneAndUpdate(
        {
            _id: req.params.id,
            recipientId: req.user.id,
            recipientType: 'user',
        },
        { $set: { isRead: true } },
        { new: true }
    ).lean();

    if (!notification) {
        throw new ApiError(404, 'Notification not found.');
    }

    res.status(200).json(
        new ApiResponse(200, { ...notification, id: String(notification._id) }, 'User notification marked as read.')
    );
});

// PUT /api/user/notifications/read-all
export const markAllUserNotificationsAsRead = asyncHandler(async (req, res) => {
    const Notification = mongoose.model('Notification');

    await Notification.updateMany(
        {
            recipientId: req.user.id,
            recipientType: 'user',
            isRead: false,
        },
        { $set: { isRead: true } },
    );

    res.status(200).json(
        new ApiResponse(200, null, 'All user notifications marked as read.')
    );
});

// DELETE /api/user/notifications/:id
export const deleteUserNotification = asyncHandler(async (req, res) => {
    const Notification = mongoose.model('Notification');

    const existing = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipientId: req.user.id,
        recipientType: 'user',
    });

    if (!existing) {
        throw new ApiError(404, 'Notification not found.');
    }

    res.status(200).json(new ApiResponse(200, null, 'User notification deleted.'));
});
