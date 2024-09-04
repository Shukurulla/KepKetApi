const categoryModel = require("../models/category.model");
const Dish = require("../models/dish.model");

exports.createDish = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(req.body.category);
    if (category) {
      const dish = new Dish(req.body);
      await dish.save();
      res.status(201).json(dish);
    } else {
      res.json({ error: "Bunday categoriya topilmadi" });
      next();
    }
  } catch (error) {
    next(error);
  }
};

exports.getAllDishes = async (req, res, next) => {
  try {
    const dishes = await Dish.find({ restourantId: req.params.id });
    res.json(dishes);
  } catch (error) {
    next(error);
  }
};

exports.getDish = async (req, res, next) => {
  console.log(req.params.id);
  try {
    const dish = await Dish.find();

    if (!dish) return res.status(404).json({ message: "Taom topilmadi" });
    res.json(dish);
  } catch (error) {
    next(error);
  }
};

exports.updateDish = async (req, res, next) => {
  try {
    const dish = await Dish.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
      }
    );
    if (!dish) return res.status(404).json({ message: "Taom topilmadi" });
    res.json(dish);
  } catch (error) {
    next(error);
  }
};

exports.deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) return res.status(404).json({ message: "Taom topilmadi" });
    res.json({
      message: "Taom muvaffaqiyatli ochirildi",
    });
  } catch (error) {
    next(error);
  }
};
