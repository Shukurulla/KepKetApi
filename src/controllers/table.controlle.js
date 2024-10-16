const orderModel = require("../models/order.model.js");
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
    // Fetch all tables
    const tables = await tableModel.find({ restaurantId: req.params.id });

    // Fetch all unpaid orders
    const unpaidOrders = await orderModel.find({
      restaurantId: req.params.id,
      payment: false, // faqat to'lov qilinmagan orderlarni olish
    });

    // Create a Map to store unpaid orders for each table
    const tableOrderMap = new Map();
    unpaidOrders.forEach((order) => {
      const tableId = order.tableNumber.id.toString(); // Bu yerda to'g'ri solishtirish uchun toString() qilamiz
      if (!tableOrderMap.has(tableId)) {
        tableOrderMap.set(tableId, []);
      }
      tableOrderMap.get(tableId).push(order); // Har bir orderni o'z stoliga qo'shamiz
    });

    // Map tables to include busy status
    const tablesWithStatus = tables.map((table) => {
      const tableId = table._id.toString(); // Stolning ID sini olamiz
      const unpaidOrdersForTable = tableOrderMap.get(tableId) || []; // Bu yerda to'lanmagan orderlar bor-yo'qligini tekshiramiz
      return {
        ...table.toObject(), // Stolning barcha xususiyatlarini tarqatamiz
        busy: unpaidOrdersForTable.length > 0, // Agar to'lanmagan orderlar bo'lsa busy: true qilamiz
      };
    });

    res.json({ tables: tablesWithStatus }); // Stolni busy qiymati bilan qaytaramiz
  } catch (error) {
    console.error("Error fetching table status:", error);
    res.status(500).json({ message: "Error fetching table status" });
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
