const Order = require("../models/order.model");
const Dish = require("../models/dish.model");
const Restaurant = require("../models/restaurant.model");
const {
  validateOrderInput,
  validateOrderStatus,
} = require("../utils/validators");
const logger = require("../utils/logger");

// Yangi buyurtma yaratish
exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, tableNumber, items, customerName, customerPhone } =
      req.body;

    // Input validatsiyasi
    const { error } = validateOrderInput(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Restoranni tekshirish
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(400).json({ message: "Restoran topilmadi" });
    }

    // Umumiy narxni hisoblash
    let totalPrice = 0;
    for (let item of items) {
      const dish = await Dish.findById(item.dish);
      if (!dish) {
        return res
          .status(400)
          .json({ message: `Taom topilmadi: ${item.dish}` });
      }
      totalPrice += dish.price * item.quantity;
    }

    const order = new Order({
      restaurantId,
      tableNumber,
      items,
      totalPrice,
      customerName,
      customerPhone,
    });

    await order.save();
    logger.info(`Yangi buyurtma yaratildi: ${order._id}`);
    res.status(201).json(order);
  } catch (error) {
    logger.error("Buyurtma yaratishda xatolik:", error);
    res.status(500).json({
      message: "Buyurtma yaratishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Barcha buyurtmalarni olish
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: [
        { path: "restaurant", select: "name" },
        { path: "items.dish", select: "name price" },
      ],
    };

    const orders = await Order.paginate({}, options);
    res.status(200).json(orders);
  } catch (error) {
    logger.error("Buyurtmalarni olishda xatolik:", error);
    res.status(500).json({
      message: "Buyurtmalarni olishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Bitta buyurtmani ID bo'yicha olish
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("restaurant", "name")
      .populate("items.dish", "name price");
    if (!order) {
      return res.status(404).json({ message: "Buyurtma topilmadi" });
    }
    res.status(200).json(order);
  } catch (error) {
    logger.error("Buyurtmani olishda xatolik:", error);
    res.status(500).json({
      message: "Buyurtmani olishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Buyurtma holatini yangilash
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Status validatsiyasi
    const { error } = validateOrderStatus(status);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Buyurtma topilmadi" });
    }
    logger.info(
      `Buyurtma holati yangilandi: ${order._id}, Yangi holat: ${status}`
    );
    res.status(200).json(order);
  } catch (error) {
    logger.error("Buyurtma holatini yangilashda xatolik:", error);
    res.status(500).json({
      message: "Buyurtma holatini yangilashda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Buyurtmani o'chirish (admin uchun)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Buyurtma topilmadi" });
    }
    logger.info(`Buyurtma o'chirildi: ${order._id}`);
    res.status(200).json({ message: "Buyurtma muvaffaqiyatli ochirildi" });
  } catch (error) {
    logger.error("Buyurtmani ochirishda xatolik:", error);
    res.status(500).json({
      message: "Buyurtmani ochirishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Restoran bo'yicha buyurtmalarni olish
exports.getOrdersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: { path: "items.dish", select: "name price" },
    };

    const orders = await Order.paginate({ restaurant: restaurantId }, options);
    res.status(200).json(orders);
  } catch (error) {
    logger.error("Restoran buyurtmalarini olishda xatolik:", error);
    res.status(500).json({
      message: "Restoran buyurtmalarini olishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Buyurtmani yangilash
exports.updateOrder = async (req, res) => {
  try {
    const { items, status, customerName, customerPhone } = req.body;
    let totalPrice = 0;

    if (items) {
      for (let item of items) {
        const dish = await Dish.findById(item.dish);
        if (!dish) {
          return res
            .status(400)
            .json({ message: `Taom topilmadi: ${item.dish}` });
        }
        totalPrice += dish.price * item.quantity;
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        items: items || undefined,
        totalPrice: items ? totalPrice : undefined,
        status: status || undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      },
      { new: true, omitUndefined: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Buyurtma topilmadi" });
    }

    logger.info(`Buyurtma yangilandi: ${updatedOrder._id}`);
    res.status(200).json(updatedOrder);
  } catch (error) {
    logger.error("Buyurtmani yangilashda xatolik:", error);
    res.status(500).json({
      message: "Buyurtmani yangilashda xatolik yuz berdi",
      error: error.message,
    });
  }
};

// Buyurtmalar statistikasi
exports.getOrderStatistics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: "completed" });
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.status(200).json({
      totalOrders,
      completedOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    logger.error("Statistika olishda xatolik:", error);
    res.status(500).json({
      message: "Statistika olishda xatolik yuz berdi",
      error: error.message,
    });
  }
};
