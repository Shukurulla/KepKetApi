const waiterController = require("../controllers/waiter.controller");
const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const waiterModel = require("../models/waiter.model.js");

const router = express.Router();

router.get("/all/:id", waiterController.getWaiters);
router.get("/:id", waiterController.getWaiterById);
router.post("/", authMiddleware, waiterController.createWaiter);
router.post("/login", waiterController.loginWaiter);
router.put("/:id", authMiddleware, waiterController.editWaiter);
router.put("/edit-password/:id", authMiddleware, waiterController.editPassword);
router.delete("/:id", authMiddleware, waiterController.deleteWaiter);
router.get("/all/delete", async (req, res) => {
  const findWaiters = await waiterModel.find();
  //   for (let i = 0; i < findWaiters.length; i++) {
  //     await waiterModel.findByIdAndDelete(findWaiters[i]._id);
  //   }
  res.json(findWaiters);
});
module.exports = router;
