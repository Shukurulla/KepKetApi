const Restaurant = require("../models/restaurant.model");
const config = require("../config/config.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const restaurantModel = require("../models/restaurant.model");
exports.createRestaurant = async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const restaurant = await Restaurant.create({
      ...req.body,
      password: hashedPassword,
    });
    const token = jwt.sign(
      { userId: restaurant._id, role: restaurant.role },
      config.jwtSecret,
      { expiresIn: "30d" }
    );
    res.status(201).json({ restaurant, token });
  } catch (error) {
    res.status(500).json({
      message: "Restoran yaratishda xatolik yuz berdi",
      error: error.message,
    });
  }
};
exports.loginRestaurant = async (req, res, next) => {
  try {
    const { password, name } = req.body;
    const restaurant = await restaurantModel.findOne({ name });

    if (!restaurant) {
      return res.status(401).json({ message: "Notog'ri restoran nomi" });
    }

    const isPasswordMatch = await bcrypt.compare(password, restaurant.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Notog'ri  parol" });
    }

    const token = jwt.sign(
      { userId: restaurant._id, role: restaurant.role },
      config.jwtSecret,
      { expiresIn: "30d" }
    );

    return res.status(200).json({ restaurant, token }); // Bu yerda `return` ishlatildi
  } catch (error) {
    return res.status(400).json({ error: error.message }); // Bu yerda ham `return` ishlatildi
  }
};

// Barcha restoranlarni olish
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({
      message: "Restoranlarni olishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Bitta restorani ID bo'yicha olish
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    console.log(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restoran topilmadi" });
    }
    const token = jwt.sign(
      { userId: restaurant._id, role: restaurant.role },
      config.jwtSecret,
      { expiresIn: "30d" }
    );
    res.status(201).json({ restaurant, token });
  } catch (error) {
    res.status(500).json({
      message: "Restorani olishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Restorani yangilash
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restoran topilmadi" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({
      message: "Restorani yangilashda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Restorani o'chirish
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restoran topilmadi" });
    }
    res.json({ message: "Restoran muvaffaqiyatli ochirildi" });
  } catch (error) {
    res.status(500).json({
      message: "Restorani ochirishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Restoranga stol qo'shish
exports.addTable = async (req, res) => {
  try {
    const { number, capacity } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $push: { tables: { number, capacity } } },
      { new: true }
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restoran topilmadi" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({
      message: "Stol qoshishda xatolik yuz berdi",
      error: error.message,
    });
  }
};
