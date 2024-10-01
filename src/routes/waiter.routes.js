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
    const findOrders = await orderModel.find({ restaurantId: userId });
    const shortOrders = findOrders.map((c) => {
      const data = {
        order: c._id,
        waiter: c.waiter.id,
      };
      return data;
    });

    function countWaiters(orders) {
      const result = {};

      orders.forEach((order) => {
        const waiter = order.waiter;
        if (result[waiter]) {
          result[waiter].count += 1;
        } else {
          result[waiter] = {
            waiter: waiter,
            count: 1,
          };
        }
      });

      // Massivga o'zgartirish
      return Object.values(result);
    }

    const waiterService = countWaiters(shortOrders);

    res.json(waiterService);
  } catch (error) {
    res.json({ message: error.message });
  }
});
router.get("/:id", waiterController.getWaiterById);
router.post("/", authMiddleware, waiterController.createWaiter);
router.post("/login", waiterController.loginWaiter);
router.put("/:id", authMiddleware, waiterController.editWaiter);
router.put("/edit-password/:id", authMiddleware, waiterController.editPassword);
router.delete("/:id", authMiddleware, waiterController.deleteWaiter);

module.exports = router;
