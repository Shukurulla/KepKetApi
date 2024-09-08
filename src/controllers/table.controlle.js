const restaurantModel = require("../models/restaurant.model");
const tableModel = require("../models/table.model");

exports.createTable = async (req, res, next) => {
  const { restaurantId, tableNumber, capacity } = req.body;
  const restaurant = await restaurantModel.findById(restaurantId);

  if (restaurant) {
    const tables = await tableModel.create(req.body);
    if (tables) {
      res.status(201).json({ tables });
    } else {
      next();
      res.status(400).json({ msg: "Stol qoshishda muammo paydo boldi" });
    }
  } else {
    next();
    res.status(404).json({ msg: "Bunday restoran topilmadi" });
  }
};
exports.allTables = async (req, res, next) => {
  try {
    const tables = await tableModel.find({ restaurantId: req.params.id });

    res.status(200).json(tables);
  } catch (error) {
    res.json({ msg: "Stollarni olishda xatolik yuz berdi" });
    next();
  }
};
exports.tableById = async (req, res, next) => {
  try {
    const table = await tableModel.findById(req.params.id);
    res.json(table);
  } catch (error) {
    res.json({ msg: "Stollarni olishda xatolik yuz berdi" });
    next();
  }
};
exports.editTable = async (req, res, next) => {
  try {
    await tableModel.findByIdAndUpdate(req.params.id, req.body);
    const table = await tableModel.findById(req.params.id);
    res.json(table);
  } catch (error) {
    res.json({ msg: "Stollarni olishda xatolik yuz berdi" });
    next();
  }
};
exports.deleteTable = async (req, res, next) => {
  try {
    await tableModel.findByIdAndDelete(req.params.id);
    const table = await tableModel.findById(req.params.id);
    res.json(table);
  } catch (error) {
    res.json({ msg: "Stollarni olishda xatolik yuz berdi" });
    next();
  }
};
