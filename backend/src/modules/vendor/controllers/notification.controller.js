import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Notification from '../../../models/Notification.model.js';

// GET /api/vendor/notifications
export const getVendorNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 20);
    const skip = (numericPage - 1) * numericLimit;

    const filter = {
        recipientId: req.user.id,
        recipientType: 'vendor',
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
            .skip(Number(skip))
            .limit(Number(numericLimit))
            .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({
            recipientId: req.user.id,
            recipientType: 'vendor',
            isRead: false,
        }),
    ]);

    // Ensure they have 'id' instead of just '_id' for frontend compatibility
    const mappedNotifications = notifications.map(n => ({
        ...n,
        id: n._id
    }));

    res.status(200).json(
        new ApiResponse(
            200,
            {
                notifications: mappedNotifications,
                total,
                unreadCount,
                page: numericPage,
                pages: Math.ceil(total / numericLimit),
            },
            'Vendor notifications fetched.'
        )
    );
});

// PUT /api/vendor/notifications/:id/read
export const markVendorNotificationAsRead = asyncHandler(async (req, res) => {
    const existing = await Notification.findOne({
        _id: req.params.id,
        recipientId: req.user.id,
        recipientType: 'vendor',
    }).lean();

    if (!existing) {
        throw new ApiError(404, 'Notification not found.');
    }

    const doc = await Notification.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { isRead: true } },
        { new: true }
    ).lean();

    const notification = { ...doc, id: doc._id };

    res.status(200).json(
        new ApiResponse(200, notification, 'Vendor notification marked as read.')
    );
});

// PUT /api/vendor/notifications/read-all
export const markAllVendorNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            recipientId: req.user.id,
            recipientType: 'vendor',
            isRead: false,
        },
        { $set: { isRead: true } }
    );

    res.status(200).json(
        new ApiResponse(200, null, 'All vendor notifications marked as read.')
    );
});

// DELETE /api/vendor/notifications/:id
export const deleteVendorNotification = asyncHandler(async (req, res) => {
    const existing = await Notification.findOne({
        _id: req.params.id,
        recipientId: req.user.id,
        recipientType: 'vendor',
    }).lean();

    if (!existing) {
        throw new ApiError(404, 'Notification not found.');
    }

    await Notification.findOneAndDelete({ _id: req.params.id });

    res.status(200).json(new ApiResponse(200, null, 'Vendor notification deleted.'));
});
