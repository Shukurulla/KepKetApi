const categoryModel = require("../models/category.model");

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryModel.find();
    const filterCategory = categories.filter(
      (c) => c.restaurantId == req.params.id
    );
    res.json(filterCategory);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
exports.createCategory = async (req, res, next) => {
  try {
    const category = await categoryModel.create(req.body);
    res.json(category);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
exports.getCategoryId = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    res.json(category);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
exports.editCategory = async (req, res, next) => {
  try {
    await categoryModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    const category = await categoryModel.findById(req.params.id);
    res.json(category);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
exports.deleteCategory = async (req, res, next) => {
  try {
    await categoryModel.findByIdAndDelete(req.params.id);
    const category = await categoryModel.findById(req.params.id);
    res.json(category);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
