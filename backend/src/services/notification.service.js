import mongoose from 'mongoose';

/**
 * Create a notification for a user/vendor/delivery/admin
 * @param {Object} options - { recipientId, recipientType, title, message, type, data }
 */
export const createNotification = async ({ recipientId, recipientType, title, message, type = 'system', data = {} }) => {
    const Notification = mongoose.model('Notification');
    return Notification.create({
        recipientId,
        recipientType,
        title,
        message,
        type,
        data
    });
};

/**
 * Get unread notifications for a recipient
 */
export const getUnreadNotifications = async (recipientId, recipientType) => {
    const Notification = mongoose.model('Notification');
    return Notification.find({ recipientId, recipientType, isRead: false })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
};

/**
 * Mark all notifications as read for a recipient
 */
export const markAllAsRead = async (recipientId, recipientType) => {
    const Notification = mongoose.model('Notification');
    return Notification.updateMany(
        { recipientId, recipientType, isRead: false },
        { $set: { isRead: true } }
    );
};
