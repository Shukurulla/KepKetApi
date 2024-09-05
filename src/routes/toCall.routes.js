const express = require("express");
const callController = require("../controllers/toCall.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/all/:id", callController.getAllCalls);
router.get("/:id", callController.getCall);
router.post("/", authMiddleware, callController.createCall);
router.put("/:id", authMiddleware, callController.editCall);
router.put("/done/:id", authMiddleware, callController.doneCall);
router.delete("/:id", authMiddleware, callController.deleteCall);

module.exports = router;
