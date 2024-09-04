const restaurantModel = require("../models/restaurant.model");
const waiterModel = require("../models/waiter.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

exports.createWaiter = async (req, res, next) => {
  try {
    const { restaurantId, password } = req.body;
    const restaurant = await restaurantModel.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: "Bunday restoran topilmadi" });
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
  try {
    const waiter = await waiterModel.findByIdAndUpdate(
      req.params.id,
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
    const waiter = await waiterModel.findByIdAndDelete(req.params.id);
    if (waiter == null) {
      return res.json({ msg: "Ofitsiant muaffaqiyati ochirildi" });
    } else {
      return res.json({ error: "Ofitsiyant ochirilmadi" });
    }
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
