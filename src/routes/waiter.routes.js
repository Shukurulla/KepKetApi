const waiterController = require("../controllers/waiter.controller.js");
const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware.js");
const waiterModel = require("../models/waiter.model.js");
const { authenticateJWT } = require("../middlewares/profile.middleware.js");
const restaurantModel = require("../models/restaurant.model.js");
const orderModel = require("../models/order.model.js");

const router = express.Router();

router.get("/all/:id", waiterController.getWaiters);
router.get("/waiters-info", authMiddleware, async (req, res) => {
  const { userId } = req.userData;
  try {
    // Barcha ofitsiantlarni olish
    const allWaiters = await waiterModel.find({ restaurantId: userId });

    // Buyurtmalarni topish va waiter obyektini populate qilish
    const findOrders = await orderModel
      .find({ restaurantId: userId })
      .populate("waiter");

    // Buyurtmalardan waiter va order ma'lumotlarini olish
    const shortOrders = findOrders.map((c) => {
      return {
        order: c._id,
        waiter: c.waiter ? c.waiter.id.toString() : null, // Waiter mavjudligini tekshirish
      };
    });

    // Funksiya: waiterlar bo'yicha buyurtmalarni guruhlash
    function countWaiters(orders) {
      const result = {};

      orders.forEach((order) => {
        const waiterId = order.waiter;
        if (!waiterId) return; // Waiter mavjud bo'lmasa o'tkazib yuborish

        if (result[waiterId]) {
          result[waiterId].orders.push(order.order);
          result[waiterId].count += 1;
        } else {
          result[waiterId] = {
            waiter: waiterId,
            count: 1,
            orders: [order.order], // Buyurtmalar ro'yxati
          };
        }
      });

      // Resultni massiv ko'rinishiga o'tkazish
      return Object.values(result);
    }

    // Orderlarni guruhlash
    const waiterService = countWaiters(shortOrders);

    // Har bir waiter haqida batafsil ma'lumot olish
    const detailedWaiters = await Promise.all(
      allWaiters.map(async (waiter) => {
        const waiterData = waiterService.find(
          (w) => w.waiter === waiter._id.toString()
        );
        return {
          waiterId: waiter._id,
          name: waiter.username,
          imageWaiter: waiter.imageWaiter,
          rating: waiter.rating,
          atWork: waiter.atWork,
          busy: waiter.busy,
          orderCount: waiterData ? waiterData.count : 0, // Agar buyurtma bo'lmasa, 0
          orders: waiterData ? waiterData.orders : [], // Agar buyurtma bo'lmasa, bo'sh massiv
        };
      })
    );

    // Javobni qaytarish
    res.json(detailedWaiters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", waiterController.getWaiterById);
router.post("/", authMiddleware, waiterController.createWaiter);
router.post("/login", waiterController.loginWaiter);
router.put("/", authMiddleware, waiterController.editWaiter);
router.put("/edit-password/:id", authMiddleware, waiterController.editPassword);
router.delete("/:id", authMiddleware, waiterController.deleteWaiter);

module.exports = router;
