const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createTable,
  allTables,
  deleteTable,
  editTable,
  tableById,
} = require("../controllers/table.controlle");

const router = express.Router();

router.post("/create-table", authMiddleware, createTable);
router.get("/all-tables/:id", authMiddleware, allTables);
router.get("/table/:id", tableById);
router.put("/table-edit/:id", authMiddleware, editTable);
router.delete("/table-delete/:id", authMiddleware, deleteTable);
module.exports = router;
