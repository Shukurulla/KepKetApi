const Dish = require('../models/dish.model');

exports.createDish = async (req, res, next) => {
    try {
        const dish = new Dish(req.body);
        await dish.save();
        res.status(201).json(dish);
    } catch (error) {
        next(error);
    }
};

exports.getAllDishes = async (req, res, next) => {
    try {
        const dishes = await Dish.find();
        res.json(dishes);
    } catch (error) {
        next(error);
    }
};

exports.getDish = async (req, res, next) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ message: 'Taom topilmadi' });
        res.json(dish);
    } catch (error) {
        next(error);
    }
};

exports.updateDish = async (req, res, next) => {
    try {
        const dish = await Dish.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!dish) return res.status(404).json({ message: 'Taom topilmadi' });
        res.json(dish);
    } catch (error) {
        next(error);
    }
};

exports.deleteDish = async (req, res, next) => {
    try {
        const dish = await Dish.findByIdAndDelete(req.params.id);
        if (!dish) return res.status(404).json({ message: 'Taom topilmadi' });
        res.json({
            message: 'Taom muvaffaqiyatli ochirildi' });
  } catch (error) {
            next(error);
        }
    };