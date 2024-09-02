const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const orderController = require("../controllers/order.controller");

const router = express.Router();

router.get("/all-order", authMiddleware, orderController.getAllOrders);
router.post("/create-order", authMiddleware, orderController.createOrder);

module.exports = router;
