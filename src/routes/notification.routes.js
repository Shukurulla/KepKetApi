const express = require("express");
const notificationRoute = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, notificationRoute.createaNotification);
router.put("/complate/:id", authMiddleware, notificationRoute.complate);
router.get("/all/:id", authMiddleware, notificationRoute.getAllNotification);
router.get("/:id", notificationRoute.getMyNotification);
router.put("/:id", authMiddleware, notificationRoute.editNotification);
router.delete("/:id", authMiddleware, notificationRoute.deleteNotification);

module.exports = router;
