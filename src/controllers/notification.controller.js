const Notification = require('../models/notification.model');
const notificationService = require('../services/notification.service');

exports.createNotification = async (req, res, next) => {
    try {
        const notification = await notificationService.createNotification(req.body);
        res.status(201).json(notification);
    } catch (error) {
        next(error);
    }
};

exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await notificationService.getNotifications(req.userData.userId);
        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id);
        res.json(notification);
    } catch (error) {
        next(error);
    }
};

