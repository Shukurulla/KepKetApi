const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const {
  getPromocCodeById,
  createPromoCode,
  deletePromoCode,
  editPromoCode,
  getAllPromoCodes,
  getCode,
} = require("../controllers/promoCode.controller");

const router = express.Router();

router.get("/all/:id", getAllPromoCodes);
router.get("/:id", getPromocCodeById);
router.get("/code/:id", getCode);
router.post("/", authMiddleware, createPromoCode);
router.put("/:id", authMiddleware, editPromoCode);
router.delete("/:id", authMiddleware, deletePromoCode);

module.exports = router;
