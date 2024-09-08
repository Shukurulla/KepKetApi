const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurant.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const cors = require("cors");
const { authenticateJWT } = require("../middlewares/profile.middleware");
const restaurantModel = require("../models/restaurant.model");

router.post("/", cors(), restaurantController.createRestaurant);
router.post("/login", cors(), restaurantController.loginRestaurant);
router.get("/", cors(), restaurantController.getAllRestaurants);
router.get("/:id", cors(), restaurantController.getRestaurantById);
router.put(
  "/:id",
  authMiddleware,
  cors(),
  restaurantController.updateRestaurant
);
router.delete(
  "/:id",
  authMiddleware,
  cors(),
  restaurantController.deleteRestaurant
);
router.post(
  "/:id/tables",
  authMiddleware,
  cors(),
  restaurantController.addTable
);
router.get("/profile/", authMiddleware, (req, res) => {
  console.log(req);
});
module.exports = router;
