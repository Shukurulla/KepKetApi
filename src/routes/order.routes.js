const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const orderController = require("../controllers/order.controller");

const router = express.Router();

router.get("/all/:id", orderController.getAllOrders);
router.post("/create-order", authMiddleware, orderController.createOrder);
router.post(
  "/waiter-order/",
  authMiddleware,
  orderController.waiterCreateOrder
);
router.get("/:id", orderController.getOrderById);
router.put("/:id", authMiddleware, orderController.updateOrder);
router.delete("/:id", authMiddleware, orderController.deleteOrder);
router.get("/waiter-order/:id", orderController.waiterOrders);

module.exports = router;
