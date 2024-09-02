const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurant.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, restaurantController.createRestaurant);
router.get("/", restaurantController.getAllRestaurants);
router.get("/:id", restaurantController.getRestaurantById);
router.put("/:id", authMiddleware, restaurantController.updateRestaurant);
router.delete("/:id", authMiddleware, restaurantController.deleteRestaurant);
router.post("/:id/tables", authMiddleware, restaurantController.addTable);
module.exports = router;
