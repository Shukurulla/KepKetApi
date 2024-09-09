const Order = require("../models/order.model");
const Dish = require("../models/dish.model");
const Restaurant = require("../models/restaurant.model");
const {
  validateOrderInput,
  validateOrderStatus,
} = require("../utils/validators");
const logger = require("../utils/logger");
const tableModel = require("../models/table.model");
const promoCodeModel = require("../models/promoCode.model");
const waiterModel = require("../models/waiter.model");
const orderModel = require("../models/order.model");
exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, totalPrice, tableNumber, items, promoCode } =
      req.body;

    const { error } = validateOrderInput(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return res.status(400).json({ message: "Restoran topilmadi" });

    const table = await tableModel.findById(tableNumber.id);
    if (!table)
      return res.status(400).json({ message: "Bunday stol topilmadi" });

    let finalPrice = totalPrice;

    // Check and apply promo code if provided
    if (promoCode) {
      const getPromoCode = await promoCodeModel.findById(promoCode);
      if (!getPromoCode)
        return res.status(400).json({ message: "Bunday PromoCode topilmadi" });

      if (getPromoCode.worked)
        return res.status(400).json({ message: "Bu kod oldin ishlatilgan" });

      finalPrice -= getPromoCode.discount || 0;
    }

    // Find available waiters and assign one to the order
    const waiters = await waiterModel.find({ restaurantId, busy: false });
    let assignedWaiterId = null;

    const randomWaiter =
      waiters && waiters[Math.floor(Math.random() * waiters.length)];
    assignedWaiterId = randomWaiter && randomWaiter._id;

    // Mark the assigned waiter as busy
    await waiterModel.findByIdAndUpdate(
      randomWaiter._id,
      { busy: true },
      { new: true }
    );

    // Create the order with the assigned waiter (if any)
    const order = new Order({
      restaurantId,
      tableNumber,
      items,
      totalPrice: finalPrice,
      promoCode: promoCode || null,
      waiter: { id: assignedWaiterId }, // Set the waiter ID here
    });

    await order.save();

    // Update the promo code status if used
    if (promoCode) {
      await promoCodeModel.findByIdAndUpdate(
        promoCode,
        {
          $set: { worked: true, workedBy: order._id },
        },
        { new: true }
      );
    }

    logger.info(`Yangi buyurtma yaratildi: ${order._id}`);
    return res.status(201).json(order);
  } catch (error) {
    logger.error("Buyurtma yaratishda xatolik:", error);
    return res.status(500).json({
      message: "Buyurtma yaratishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

exports.waiterCreateOrder = async (req, res) => {
  try {
    const { restaurantId, waiter, tableNumber, items, promoCode } = req.body;

    // Restoranni tekshirish
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(400).json({ message: "Restoran topilmadi" });
    }

    // Stolni tekshirish
    const table = await tableModel.findById(tableNumber.id);
    if (!table) {
      return res.status(400).json({ message: "Bunday stol topilmadi" });
    }

    let discount = 0;

    if (promoCode) {
      // Promo kodni tekshirish
      const getPromoCode = await promoCodeModel.findOne({ code: promoCode });
      if (!getPromoCode) {
        return res.status(400).json({ message: "Bunday PromoCode topilmadi" });
      }
      if (getPromoCode.worked) {
        return res.status(400).json({ error: "Bu promokod ishlatilgan" });
      }
      // Discount qiymatini saqlab qolamiz
      discount = getPromoCode.discount;
    }

    // Jami narxni hisoblash
    const totalPrice =
      items.reduce((total, item) => {
        return total + item.dish.price * item.quantity;
      }, 0) - discount;

    // Waiterni band qilish
    const waiterUpdate = await waiterModel.findByIdAndUpdate(waiter.id, {
      $set: { busy: true },
    });
    if (!waiterUpdate) {
      return res.status(500).json({ error: "Waiterni yangilashda xatolik" });
    }

    // Buyurtmani yaratish
    const order = await orderModel.create({ ...req.body, totalPrice });
    if (!order) {
      return res.status(400).json({ error: "Buyurtma berishda xatolik ketdi" });
    }

    // Promo kodni ishlatilgan deb belgilash
    if (promoCode) {
      await promoCodeModel.findByIdAndUpdate(getPromoCode._id, {
        $set: { worked: true, workedBy: order._id },
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ error: "Ichki server xatoligi" });
  }
};

// Barcha buyurtmalarni olish
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    const filtered = orders.filter((c) => c.restaurantId == req.params.id);
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
    const order = await Order.findById(req.params.id);
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
        $set: req.body,
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
exports.waiterOrders = async (req, res, next) => {
  try {
    const findOrders = await orderModel.find();
    const currentWaiterOrders = findOrders.filter(
      (c) => c.waiter.id === req.params.id
    );
    if (!currentWaiterOrders) {
      return res
        .status(400)
        .json({ error: "Bunday ofitsiyntning buyurtmasi topilmadi" });
    }
    res.status(200).json(currentWaiterOrders);
  } catch (error) {
    res.status(400).json({ error: error.message0 });
    next();
  }
};
