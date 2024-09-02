const Notification = require('../models/notification.model');

exports.createNotification = async (notificationData) => {
    const notification = new Notification(notificationData);
    return await notification.save();
};

exports.getNotifications = async (userId) => {
    return await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
};

exports.markAsRead = async (notificationId) => {
    return await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
};

exports.sendNotificationToUser = async (userId, message, type, relatedItem = null, onModel = null) => {
    const notificationData = {
        recipient: userId,
        message,
        type,
        relatedItem,
        onModel
    };
    return await this.createNotification(notificationData);
};