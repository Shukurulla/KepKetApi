const Dish = require('../models/dish.model');

exports.createDish = async (dishData) => {
    const dish = new Dish(dishData);
    return await dish.save();
};

exports.getAllDishes = async () => {
    return await Dish.find();
};

exports.getDishById = async (id) => {
    return await Dish.findById(id);
};

exports.updateDish = async (id, updateData) => {
    return await Dish.findByIdAndUpdate(id, updateData, { new: true });
};

exports.deleteDish = async (id) => {
    return await Dish.findByIdAndDelete(id);
};