const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllCategories,
  createCategory,
  deleteCategory,
  editCategory,
  getCategoryId,
} = require("../controllers/category.controlle");

const router = express.Router();

router.get("/all/:id", getAllCategories);
router.get("/:id", getCategoryId);
router.post("/", authMiddleware, createCategory);
router.put("/:id", authMiddleware, editCategory);
router.delete("/:id", authMiddleware, deleteCategory);

module.exports = router;
