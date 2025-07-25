const restaurantModel = require("../models/restaurant.model");
const waiterModel = require("../models/waiter.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const orderModel = require("../models/order.model.js");

// Waiter ning bugungi ishlarini olish
exports.getTodayWork = async (req, res) => {
  try {
    const { userId } = req.userData;

    const waiter = await waiterModel.findById(userId);
    if (!waiter) {
      return res.status(404).json({ message: "Waiter topilmadi" });
    }

    // Bugungi sana
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bugungi orderlar
    const orders = await orderModel
      .find({
        "waiter.id": userId,
        createdAt: { $gte: today, $lt: tomorrow },
      })
      .sort({ createdAt: -1 });

    // Bugungi notificationlar
    const notifications = await notificationModel
      .find({
        "waiter.id": userId,
        createdAt: { $gte: today, $lt: tomorrow },
      })
      .sort({ createdAt: -1 });

    res.json({
      orders,
      notifications,
      waiterInfo: {
        name: waiter.username,
        busy: waiter.busy,
        rating: waiter.rating || 5,
      },
    });
  } catch (error) {
    console.error("Get today work error:", error);
    res.status(500).json({
      message: "Bugungi ishlarni olishda xatolik",
      error: error.message,
    });
  }
};

// Waiter ning aktiv orderlarini olish
exports.getActiveOrders = async (req, res) => {
  try {
    const { userId } = req.userData;

    // Faqat aktiv statusdagi orderlar
    const activeStatuses = ["pending", "preparing", "ready"];

    const orders = await orderModel
      .find({
        "waiter.id": userId,
        status: { $in: activeStatuses },
        showOrder: true,
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get active orders error:", error);
    res.status(500).json({
      message: "Aktiv orderlarni olishda xatolik",
      error: error.message,
    });
  }
};
exports.createWaiter = async (req, res, next) => {
  try {
    const { restaurantId, password, username } = req.body;
    const restaurant = await restaurantModel.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ error: "Bunday restoran topilmadi" });
    }

    const findWaiter = await waiterModel.findOne({ username, restaurantId });

    if (findWaiter) {
      return res.json({ message: "Bunday ofitsiyant oldin royhatdan otgan" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const waiter = await waiterModel.create({
      ...req.body,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: waiter._id, role: waiter.role },
      config.jwtSecret,
      { expiresIn: "30d" }
    );
    res.status(200).json({ data: waiter, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};

exports.getWaiterById = async (req, res, next) => {
  try {
    const waiter = await waiterModel.findById(req.params.id);
    if (!waiter) {
      return res.status(400).json({ error: "Bunday ofitsiant topilmadi" });
    }
    res.status(200).json(waiter);
  } catch (error) {
    res.status(404).json({ error: error.message });
    next();
  }
};
exports.loginWaiter = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const waiterByUsername = await waiterModel.findOne({ username });
    if (!waiterByUsername) {
      return res.status(404).json({ error: "Bunday username topilmadi" });
    }
    const isPasswordTrue = await bcrypt.compare(
      password,
      waiterByUsername.password
    );
    if (!isPasswordTrue) {
      return res.status(404).json({ error: "Password notogri kiritildi" });
    }
    const token = jwt.sign(
      { userId: waiterByUsername._id, role: waiterByUsername.role },
      config.jwtSecret,
      { expiresIn: "30d" }
    );
    res.status(200).json({ data: waiterByUsername, token });
  } catch (error) {
    res.status(404).json({ error: error.message });
    next();
  }
};

exports.getWaiters = async (req, res, next) => {
  try {
    const waiters = await waiterModel.find();
    const filteredWaiter = waiters.filter(
      (c) => c.restaurantId == req.params.id
    );
    if (!filteredWaiter) {
      return res.json(404).json({ error: "Bunday restoran topilmadi" });
    }
    res.status(200).json(filteredWaiter);
  } catch (error) {
    res.status(404).json({ error: error.message });
    next();
  }
};
exports.editWaiter = async (req, res, next) => {
  const { userId } = req.userData;
  try {
    const waiter = await waiterModel.findByIdAndUpdate(
      userId,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (!waiter) {
      return res.status(404).json({ error: "Bunday ofitsiant topilmadi" });
    }
    res.status(200).json(waiter);
  } catch (error) {
    res.status(404).json({ error: error.message });
    next();
  }
};
exports.editPassword = async (req, res, next) => {
  try {
    const { username, password, newPassword } = req.body;
    const waiterByUsername = await waiterModel.findOne({ username });
    if (!waiterByUsername) {
      return res.status(404).json({ error: "Bunday foydalanuvchi topilmadi" });
    }
    const comparePassword = bcrypt.compare(password, waiterByUsername.password);
    if (!comparePassword) {
      return res.json({ error: "Password mos kelmadi" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const newWaiter = await waiterModel.findByIdAndUpdate(req.params.id, {
      ...req.body,
      password: hashedPassword,
    });
    if (!newWaiter) {
      return res.json({ error: "Password ozgartirilmadi" });
    }
    res.json(newWaiter);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};

exports.deleteWaiter = async (req, res, next) => {
  try {
    await waiterModel.findByIdAndDelete(req.params.id);
    const waiter = await waiterModel.findById(req.params.id);
    res.json(waiter);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
