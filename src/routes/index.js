const express = require("express");
const router = express.Router();

// Route modullarini import qilish
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const dishRoutes = require("./dish.routes");
const orderRoutes = require("./order.routes");
const reservationRoutes = require("./reservation.routes");
const reviewRoutes = require("./review.routes");
const promoCodeRoutes = require("./promoCode.routes");
const notificationRoutes = require("./notification.routes");
const callRoutes = require("./toCall.routes");
const restaurantRoutes = require("./restaurant.routes");
const tableRoutes = require("./table.routes");
const categoryRoutes = require("./category.routes");
const waiterRoutes = require("./waiter.routes");
const KassaRoutes = require("./kassa.routes.js");

// Route'larni ro'yxatdan o'tkazish funksiyasi
const registerRoute = (path, routeModule) => {
  if (
    typeof routeModule === "function" ||
    routeModule instanceof express.Router
  ) {
    router.use(path, routeModule);
  } else {
    console.error(`Invalid route module for path: ${path}`);
  }
};

try {
  // Autentifikatsiya route'lari
  registerRoute("/auth", authRoutes);

  // Foydalanuvchilar route'lari
  registerRoute("/users", userRoutes);

  // Taomlar route'lari
  registerRoute("/dishes", dishRoutes);

  // Stol qoshish
  registerRoute("/table", tableRoutes);

  // Buyurtmalar route'lari
  registerRoute("/orders", orderRoutes);

  // Rezervatsiyalar route'lari
  registerRoute("/reservations", reservationRoutes);

  // Sharhlar route'lari
  registerRoute("/reviews", reviewRoutes);

  // Bildirishnomalar route'lari
  registerRoute("/notifications", notificationRoutes);

  // Call Routes
  registerRoute("/call", callRoutes);

  // Restoran route'lari
  registerRoute("/restaurants", restaurantRoutes);

  // Category Routes
  registerRoute("/category", categoryRoutes);

  //PromoCode Routes
  registerRoute("/promocode", promoCodeRoutes);

  // Waiter Routes
  registerRoute("/waiter", waiterRoutes);

  // Kassa Routes
  registerRoute("/kassa/", KassaRoutes);
} catch (error) {
  console.error("Error setting up routes:", error);
}

// 404 xatosi uchun middleware
router.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// Xatolarni qayta ishlash uchun middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = router;
