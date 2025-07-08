const orderModel = require("../models/order.model");
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
const restaurantModel = require("../models/restaurant.model");

exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, totalPrice, tableNumber, items, promoCode } =
      req.body;

    const { error } = validateOrderInput(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const restaurant = await restaurantModel.findById(restaurantId);
    if (!restaurant)
      return res.status(400).json({ message: "Restoran topilmadi" });

    const table = await tableModel.findById(tableNumber.id);
    if (!table)
      return res.status(400).json({ message: "Bunday stol topilmadi" });

    let finalPrice = totalPrice;

    // Promo kodini tekshirish va qo'llash
    if (promoCode) {
      const getPromoCode = await promoCodeModel.findById(promoCode);
      if (!getPromoCode)
        return res.status(400).json({ message: "Bunday PromoCode topilmadi" });

      if (getPromoCode.worked)
        return res.status(400).json({ message: "Bu kod oldin ishlatilgan" });

      finalPrice -= getPromoCode.discount || 0;
    }

    // Mavjud ofitsiantlarni topish
    const waitersRestaurant = await waiterModel.find({ restaurantId });
    const availableWaiters = waitersRestaurant.filter((c) => c.busy === false);
    let assignedWaiter = null;

    // Agar mavjud ofitsiantlar bo'lsa, ulardan birini tasodifiy tanlang
    if (availableWaiters.length > 0) {
      assignedWaiter =
        availableWaiters[Math.floor(Math.random() * availableWaiters.length)];
    } else {
      // Agar barcha ofitsiantlar band bo'lsa, restoran ofitsiantlaridan birini tasodifiy tanlang
      const allWaiters = await waiterModel.find({ restaurantId });
      if (allWaiters.length > 0) {
        assignedWaiter =
          allWaiters[Math.floor(Math.random() * allWaiters.length)];
      }
    }

    // Buyurtmani yaratish
    const findOrder = await orderModel.findOne({
      "tableNumber.id": tableNumber.id,
      payment: false,
      showOrder: true,
    });

    if (findOrder) {
      const order = await orderModel.findByIdAndUpdate(
        findOrder._id,
        {
          $set: {
            items: findOrder.items.concat(items),
            totalPrice: findOrder.totalPrice + totalPrice,
          },
        },
        { new: true }
      );

      // Socket orqali yangi order haqida xabar berish
      if (global.io) {
        // Waiterga yuborish
        if (assignedWaiter) {
          global.io
            .to(`waiter_${assignedWaiter._id}`)
            .emit("get_order_update", order);
        }
        // Restaurant owneriga yuborish
        global.io
          .to(`restaurant_${restaurantId}`)
          .emit("get_order_update", order);
      }

      return res.json(order);
    } else {
      const order = await orderModel.create({
        restaurantId,
        tableNumber,
        items,
        totalPrice: finalPrice,
        promoCode: promoCode || null,
        waiter: assignedWaiter
          ? { id: assignedWaiter._id, name: assignedWaiter.username }
          : { id: null },
        customerName: req.body.customerName || "Mijoz", // Customer name qo'shish
      });

      const createdOrder = await order.save();

      // Agar ofitsiant tayinlangan bo'lsa, uni band qiling
      if (assignedWaiter) {
        await waiterModel.findByIdAndUpdate(
          assignedWaiter._id,
          { busy: true },
          { new: true }
        );

        // Socket orqali waiterga xabar yuborish
        if (global.io) {
          global.io
            .to(`waiter_${assignedWaiter._id}`)
            .emit("get_new_order", createdOrder);
        }
      }

      // Socket orqali restaurant owneriga xabar yuborish
      if (global.io) {
        global.io
          .to(`restaurant_${restaurantId}`)
          .emit("get_new_order", createdOrder);
      }

      // Agar promo kod ishlatilgan bo'lsa, statusini yangilang
      if (promoCode) {
        await promoCodeModel.findByIdAndUpdate(
          promoCode,
          {
            $set: { worked: true, workedBy: createdOrder._id },
          },
          { new: true }
        );
      }

      return res.status(201).json(createdOrder);
    }
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
    const {
      restaurantId,
      waiter,
      tableNumber,
      items,
      promoCode,
      customerName,
    } = req.body;

    if (items.length === 0) {
      return res
        .status(400)
        .json({ message: "Siz hech narsa buyurtma qilmagansiz" });
    }

    // Restoranni tekshirish
    const restaurant = await restaurantModel.findById(restaurantId);
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
    const order = await orderModel.create({
      ...req.body,
      totalPrice,
      customerName: customerName || "Mijoz",
    });

    if (!order) {
      return res.status(400).json({ error: "Buyurtma berishda xatolik ketdi" });
    }

    // Promo kodni ishlatilgan deb belgilash
    if (promoCode) {
      const getPromoCode = await promoCodeModel.findOne({ code: promoCode });
      await promoCodeModel.findByIdAndUpdate(getPromoCode._id, {
        $set: { worked: true, workedBy: order._id },
      });
    }

    // Socket orqali xabar yuborish
    if (global.io) {
      // Waiterga yuborish
      global.io.to(`waiter_${waiter.id}`).emit("get_new_order", order);

      // Restaurant owneriga yuborish
      global.io.to(`restaurant_${restaurantId}`).emit("get_new_order", order);
    }

    res.json(order);
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ error: "Ichki server xatoligi" });
  }
};

exports.getShowOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ restaurantId: req.params.id });
    const filteredOrders = orders.filter((c) => c.showOrder == true);

    // Socket orqali ham yuborish
    if (global.io) {
      global.io.to(`restaurant_${req.params.id}`).emit(
        "new_orders",
        filteredOrders.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
    }

    res
      .status(200)
      .json(
        filteredOrders.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
  } catch (error) {
    logger.error("Buyurtmalarni olishda xatolik:", error);
    res.status(500).json({
      message: "Buyurtmalarni olishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find();
    const filtered = orders.filter((c) => c.restaurantId == req.params.id);
    res
      .status(200)
      .json(
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
  } catch (error) {
    logger.error("Buyurtmalarni olishda xatolik:", error);
    res.status(500).json({
      message: "Buyurtmalarni olishda xatolik yuz berdi",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
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

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Status validatsiyasi
    const validStatuses = [
      "pending",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Noto'g'ri status" });
    }

    const order = await orderModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Buyurtma topilmadi" });
    }

    // Socket orqali barcha ulangan clientlarga yangilanishni yuborish
    if (global.io) {
      // Restaurant owneriga yuborish
      global.io
        .to(`restaurant_${order.restaurantId}`)
        .emit("get_order_update", order);

      // Waiterga yuborish
      if (order.waiter && order.waiter.id) {
        global.io
          .to(`waiter_${order.waiter.id}`)
          .emit("get_order_update", order);
      }
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

exports.deleteOrder = async (req, res) => {
  try {
    const order = await orderModel.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Buyurtma topilmadi" });
    }

    // Socket orqali o'chirilganini xabar berish
    if (global.io) {
      global.io
        .to(`restaurant_${order.restaurantId}`)
        .emit("order_deleted", order._id);

      if (order.waiter && order.waiter.id) {
        global.io
          .to(`waiter_${order.waiter.id}`)
          .emit("order_deleted", order._id);
      }
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

    const updatedOrder = await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true, omitUndefined: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Buyurtma topilmadi" });
    }

    // Socket orqali yangilanishni yuborish
    if (global.io) {
      global.io
        .to(`restaurant_${updatedOrder.restaurantId}`)
        .emit("get_order_update", updatedOrder);

      if (updatedOrder.waiter && updatedOrder.waiter.id) {
        global.io
          .to(`waiter_${updatedOrder.waiter.id}`)
          .emit("get_order_update", updatedOrder);
      }
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

exports.getOrderStatistics = async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments();
    const completedOrders = await orderModel.countDocuments({
      status: "completed",
    });
    const totalRevenue = await orderModel.aggregate([
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
    res.status(400).json({ error: error.message });
    next();
  }
};
