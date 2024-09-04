const waiterController = require("../controllers/waiter.controller");
const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/all/:id", waiterController.getWaiters);
router.get("/:id", waiterController.getWaiterById);
router.post("/", authMiddleware, waiterController.createWaiter);
router.post("/login", authMiddleware, waiterController.loginWaiter);
router.put("/:id", authMiddleware, waiterController.editWaiter);
router.put("/edit-password/:id", authMiddleware, waiterController.editPassword);
router.delete("/:id", authMiddleware, waiterController.deleteWaiter);

module.exports = router;
