const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const orderController = require("../controllers/order.controller");
const orderModel = require("../models/order.model.js");
const io = require("../../server.js");
const router = express.Router();

router.get("/all/:id", orderController.getAllOrders);
router.get("/show-orders/:id", orderController.getShowOrders(io));
router.post("/create-order", authMiddleware, orderController.createOrder(io));
router.post(
  "/waiter-order/",
  authMiddleware,
  orderController.waiterCreateOrder(io)
);

router.get("/all-delete", async (req, res) => {
  const orders = await orderModel.find();
  for (let i = 0; i < orders.length; i++) {
    await orderModel.findByIdAndDelete(orders[i]._id);
  }
  res.json(orders);
});

router.get("/:id", orderController.getOrderById);
router.put("/:id", authMiddleware, orderController.updateOrder);
router.delete("/:id", authMiddleware, orderController.deleteOrder);
router.get("/waiter-order/:id", orderController.waiterOrders);

module.exports = router;
