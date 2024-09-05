const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurant.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", restaurantController.createRestaurant);
router.post("/login", restaurantController.loginRestaurant);
router.get("/", restaurantController.getAllRestaurants);
router.get("/:id", restaurantController.getRestaurantById);
router.put("/:id", authMiddleware, restaurantController.updateRestaurant);
router.delete("/:id", authMiddleware, restaurantController.deleteRestaurant);
router.post("/:id/tables", authMiddleware, restaurantController.addTable);
module.exports = router;
