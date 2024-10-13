const { trace } = require("joi");
const notificationModel = require("../models/notification.model");
const orderModel = require("../models/order.model");
const waiterModel = require("../models/waiter.model");

exports.createaNotification = async (req, res, next) => {
  try {
    const { orderId, meals } = req.body;
    const findOrder = await orderModel.findById(orderId);
    const notification = await notificationModel.create(req.body);

    if (!orderId) {
      return res.status(400).json({ message: "Order ID topilmadi" });
    }

    await orderModel.findByIdAndUpdate(orderId, {
      prepared: findOrder.prepared.concat(meals),
    });

    if (notification) {
      await waiterModel.findByIdAndUpdate(
        notification.waiter.id,
        {
          $set: { busy: true },
        },
        {
          new: true,
        }
      );
    }
    res.json(notification);
  } catch (error) {
    res.json({ error: error.message });
  }
};
exports.complate = async (req, res, next) => {
  try {
    const notification = await notificationModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status: "complate" },
      },
      { new: true }
    );
    if (!notification) {
      return res.status(400).json({ error: "Notification ozgarmadi" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getAllNotification = async (req, res, next) => {
  try {
    const notifications = await notificationModel.find({
      restaurantId: req.params.id,
    });
    if (!notifications) {
      return res
        .status(400)
        .json({ error: "Bu restoranning notificationlari topilmadi" });
    }
    res.json(notifications);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};

exports.getMyNotification = async (req, res, next) => {
  const { userId } = req.userData;
  try {
    const findWaiter = await waiterModel.findById(userId);
    if (!findWaiter) {
      return res.status(400).json({ message: "Bunday waiter topilmadi" });
    }
    const notifications = await notificationModel.find({
      restaurantId: findWaiter.restaurantId,
    });
    const myNotifications = notifications.filter(
      (c) => c.waiter.id == findWaiter._id
    );
    const pendingNotifications = myNotifications.filter(
      (c) => c.status.toLowerCase() == "pending"
    );
    if (!myNotifications) {
      return res
        .status(400)
        .json({ message: "Sizning notificationlaringiz topilmadi" });
    }
    res.status(200).json({
      pending: pendingNotifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getMyComplateNotification = async (req, res, next) => {
  const { userId } = req.userData;
  try {
    const findWaiter = await waiterModel.findById(userId);
    if (!findWaiter) {
      return res.status(400).json({ message: "Bunday waiter topilmadi" });
    }
    const notifications = await notificationModel.find({
      restaurantId: findWaiter.restaurantId,
    });
    const myNotifications = notifications.filter(
      (c) => c.waiter.id == findWaiter._id
    );
    const complatedNotifications = myNotifications.filter(
      (c) => c.status.toLowerCase() == "complate"
    );
    if (!myNotifications) {
      return res
        .status(400)
        .json({ message: "Sizning notificationlaringiz topilmadi" });
    }
    res.status(200).json({
      complate: complatedNotifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getNotification = async (req, res, next) => {
  try {
    const notification = await notificationModel.findById(req.params.id);
    if (!notification) {
      return res.status(400).json({ error: "Bunday notification topilmadi" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
exports.editNotification = async (req, res, next) => {
  try {
    const notification = await notificationModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    if (!notification) {
      return res.status(400).json({ error: "Notification ozgartirilmadi" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
exports.deleteNotification = async (req, res, next) => {
  try {
    await notificationModel.findByIdAndDelete(req.params.id);
    const notification = await notificationModel.findById(req.params.id);
    if (notification !== null) {
      res.status(400).json({ error: "Notification ochirilmadi" });
    }
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
