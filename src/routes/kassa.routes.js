const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware.js");
const kassaController = require("../controllers/kassa.controller.js");

const router = express.Router();

router.post("/create-kassa", authMiddleware, kassaController.createKassa);
router.get("/my-kassa", authMiddleware, kassaController.getKassa);
router.get("/kassa/:id", authMiddleware, kassaController.getKassaById);
router.get("/all-delete", kassaController.allDelete);

module.exports = router;
