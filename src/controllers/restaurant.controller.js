const Restaurant = require("../models/restaurant.model");

// Yangi restoran yaratish
exports.createRestaurant = async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Restoran yaratishda xatolik yuz berdi",
        error: error.message,
      });
  }
};

// Barcha restoranlarni olish
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Restoranlarni olishda xatolik yuz berdi",
        error: error.message,
      });
  }
};

// Bitta restorani ID bo'yicha olish
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restoran topilmadi" });
    }
    res.json(restaurant);
  } catch (error) {
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
        message: "Stol qoshishda xatolik yuz berdi",
        error: error.message,
      });
  }
};
