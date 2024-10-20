const express = require("express");
const notificationRoute = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const notificationModel = require("../models/notification.model.js");

const router = express.Router();
const io = require("../../server.js");
router.post("/", authMiddleware, notificationRoute.createaNotification(io));
router.put("/complate/:id", authMiddleware, notificationRoute.complate);
router.get("/all/:id", notificationRoute.getAllNotification);
router.get("/", authMiddleware, notificationRoute.getMyNotification);
router.get(
  "/complate",
  authMiddleware,
  notificationRoute.getMyComplateNotification
);
router.put("/:id", authMiddleware, notificationRoute.editNotification);
router.delete("/:id", authMiddleware, notificationRoute.deleteNotification);
router.get("/all-delete", async (req, res) => {
  try {
    const notifications = await notificationModel.find();
    for (let i = 0; i < notifications.length; i++) {
      await notificationModel.findByIdAndDelete(notifications[i]._id);
    }
    res.json(notifications);
  } catch (error) {}
});
module.exports = router;
