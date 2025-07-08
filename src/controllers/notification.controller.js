const notificationModel = require("../models/notification.model");
const orderModel = require("../models/order.model");
const waiterModel = require("../models/waiter.model");

exports.createNotification = async (req, res, next) => {
  try {
    const { orderId, meals, waiter, table, totalPrice, restaurantId } =
      req.body;

    let findOrder = null;
    if (orderId) {
      findOrder = await orderModel.findById(orderId);
      if (!findOrder) {
        return res.status(400).json({ message: "Order ID topilmadi" });
      }
    }

    // Bildirishnoma yaratish
    const notification = await notificationModel.create({
      orderId: orderId || null,
      meals: meals || [],
      waiter: waiter || { id: null, name: "Noma'lum" },
      table: table || { number: 0, id: null },
      totalPrice: totalPrice || 0,
      restaurantId: restaurantId || (findOrder ? findOrder.restaurantId : null),
    });

    // Buyurtma yangilash (agar orderId mavjud bo'lsa)
    if (findOrder) {
      await orderModel.findByIdAndUpdate(orderId, {
        prepared: findOrder.prepared.concat(meals || []),
      });
    }

    // Agar bildirishnoma muvaffaqiyatli yaratilsa
    if (notification) {
      // Ofitsiantni `busy` holatiga o'tkazish
      if (waiter && waiter.id) {
        await waiterModel.findByIdAndUpdate(
          waiter.id,
          { $set: { busy: true } },
          { new: true }
        );
      }

      // Socket orqali bildirishnoma yuborish - Waiter loyihasi uchun to'g'ri format
      if (global.io) {
        // Waiter loyihasi uchun formatlanган notification
        const waiterNotification = {
          _id: notification._id,
          id: notification._id,
          tableNumber: table?.number || 0,
          table: {
            id: table?.id || null,
            number: table?.number || 0,
          },
          customerName: "Mijoz",
          items:
            meals?.map((meal) => ({
              dish: {
                name: meal.foodName,
                id: meal.foodId,
                price: meal.foodPrice,
                image: meal.foodImage,
              },
              quantity: meal.quantity,
              price: meal.foodPrice,
              name: meal.foodName,
            })) || [],
          meals: meals || [],
          totalPrice: totalPrice || 0,
          time: new Date().toLocaleTimeString(),
          createdAt: new Date().toISOString(),
          status: "pending",
          waiter: waiter || { id: null, name: "Noma'lum" },
          restaurantId:
            restaurantId || (findOrder ? findOrder.restaurantId : null),
        };

        // Waiterga multiple event nomlari bilan yuborish
        if (waiter && waiter.id) {
          global.io
            .to(`waiter_${waiter.id}`)
            .emit("get_notification", waiterNotification);
          global.io
            .to(`waiter_${waiter.id}`)
            .emit("get_new_order", waiterNotification);
          global.io
            .to(`waiter_${waiter.id}`)
            .emit("notification", waiterNotification);
          global.io
            .to(`waiter_${waiter.id}`)
            .emit("waiter_notification", waiterNotification);

          console.log(
            `📤 Notification sent to waiter ${waiter.id}:`,
            waiterNotification
          );
        }

        // Restaurant owneriga yuborish
        if (notification.restaurantId) {
          global.io
            .to(`restaurant_${notification.restaurantId}`)
            .emit("get_notification", notification);
          global.io
            .to(`restaurant_${notification.restaurantId}`)
            .emit("notification_created", notification);
        }

        // Global restaurant room ga ham yuborish
        global.io
          .to(notification.restaurantId)
          .emit("get_notification", waiterNotification);
      }
    }

    // Javob qaytarish
    res.json(notification);
  } catch (error) {
    console.error("Notification creation error:", error);
    res.status(500).json({ error: error.message });
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

    // Socket orqali yangilanishni yuborish
    if (global.io) {
      const updateData = {
        _id: notification._id,
        id: notification._id,
        status: "complate",
      };

      global.io
        .to(`waiter_${notification.waiter.id}`)
        .emit("notification_updated", updateData);
      global.io
        .to(`restaurant_${notification.restaurantId}`)
        .emit("notification_updated", updateData);
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
    res.json(
      notifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    );
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

    // Socket orqali yangilanishni yuborish
    if (global.io) {
      global.io
        .to(`waiter_${notification.waiter.id}`)
        .emit("notification_updated", notification);
      global.io
        .to(`restaurant_${notification.restaurantId}`)
        .emit("notification_updated", notification);
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await notificationModel.findById(req.params.id);
    if (!notification) {
      return res.status(400).json({ error: "Notification topilmadi" });
    }

    await notificationModel.findByIdAndDelete(req.params.id);

    // Socket orqali o'chirilganini xabar berish
    if (global.io) {
      global.io
        .to(`waiter_${notification.waiter.id}`)
        .emit("notification_deleted", req.params.id);
      global.io
        .to(`restaurant_${notification.restaurantId}`)
        .emit("notification_deleted", req.params.id);
    }

    const deletedNotification = await notificationModel.findById(req.params.id);
    if (deletedNotification !== null) {
      res.status(400).json({ error: "Notification ochirilmadi" });
    }
    res.json({ message: "Notification muvaffaqiyatli ochirildi" });
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
