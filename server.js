require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const routes = require("./src/routes");

const app = express();
const httpServer = createServer(app);
const orderController = require("./src/controllers/order.controller.js");
const authMiddleware = require("./src/middlewares/auth.middleware.js");
const restaurantModel = require("./src/models/restaurant.model.js");
const logger = require("./src/utils/logger.js");
const { validateOrderInput } = require("./src/utils/validators.js");
const tableModel = require("./src/models/table.model.js");
const promoCodeModel = require("./src/models/promoCode.model.js");
const waiterModel = require("./src/models/waiter.model.js");
const orderModel = require("./src/models/order.model.js");

// CORS sozlamalari
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Timeout sozlamalari
app.use((req, res, next) => {
  res.setTimeout(30000, function () {
    console.log("Request has timed out.");
    res.status(408).send("Request has timed out.");
  });
  next();
});

// Firebase initializatsiyasi
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// MongoDB ulanish
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout 5 sekund
  })
  .then(() => console.log("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => console.error("MongoDB ga ulanishda xatolik:", err));

// Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// Socket.IO ulanish hodisasi
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join_restaurant", (restaurantId) => {
    socket.join(restaurantId);
    console.log(`Client ${socket.id} joined restaurant: ${restaurantId}`);
  });

  socket.on("waiter_connected", (waiterId) => {
    console.log(`Ofitsiant ulandi: ${waiterId} | Socket ID: ${socket.id}`);
    socket.join(waiterId);
  });

  socket.on("send_notification", async (schema) => {
    try {
      const { orderId, meals } = schema;
      // Restaurantga yuborish
      io.to(schema.restaurantId).emit("get_notification", schema);
      // Ofitsiantga yuborish
      io.to(schema.waiter.id).emit("get_notification", schema);

      const findOrder = await orderModel.findById(orderId);
      if (!findOrder) {
        return;
      }

      const notification = await notificationModel.create(schema);
      await orderModel.findByIdAndUpdate(orderId, {
        prepared: findOrder.prepared.concat(meals),
      });

      if (notification) {
        await waiterModel.findByIdAndUpdate(
          notification.waiter.id,
          { $set: { busy: true } },
          { new: true }
        );
      }
    } catch (error) {
      console.error("Notification error:", error);
    }
  });

  socket.on("send_order", async (orderData) => {
    console.log(orderData);

    try {
      const { restaurantId, totalPrice, tableNumber, items, promoCode } =
        orderData;

      // Restaurantga yuborish
      io.to(restaurantId).emit("get_new_order", orderData);

      const restaurant = await restaurantModel.findById(restaurantId);
      if (!restaurant)
        return res.status(400).json({ message: "Restoran topilmadi" });

      const table = await tableModel.findById(tableNumber.id);
      if (!table)
        return res.status(400).json({ message: "Bunday stol topilmadi" });

      let finalPrice = totalPrice;

      // Promo kodini tekshirish va qo'llash
      if (promoCode) {
        const getPromoCode = await promoCodeModel.findById(promoCode);
        if (!getPromoCode)
          return res
            .status(400)
            .json({ message: "Bunday PromoCode topilmadi" });

        if (getPromoCode.worked)
          return res.status(400).json({ message: "Bu kod oldin ishlatilgan" });

        finalPrice -= getPromoCode.discount || 0;
      }

      // Mavjud ofitsiantlarni topish
      const waitersRestaurant = await waiterModel.find({ restaurantId });
      const availableWaiters = waitersRestaurant.filter(
        (c) => c.busy === false
      );
      let assignedWaiter = null;

      // Agar mavjud ofitsiantlar bo'lsa, ulardan birini tasodifiy tanlang
      if (availableWaiters.length > 0) {
        assignedWaiter =
          availableWaiters[Math.floor(Math.random() * availableWaiters.length)];
      } else {
        // Agar barcha ofitsiantlar band bo'lsa, restoran ofitsiantlaridan birini tasodifiy tanlang
        const allWaiters = await waiterModel.find({ restaurantId });
        if (allWaiters.length > 0) {
          assignedWaiter =
            allWaiters[Math.floor(Math.random() * allWaiters.length)];
        }
      }

      // Buyurtmani yaratish
      const findOrder = await orderModel.findOne({
        "tableNumber.id": tableNumber.id,
        payment: false,
        showOrder: true,
      });

      if (findOrder) {
        const order = await orderModel.findByIdAndUpdate(
          findOrder._id,
          {
            $set: {
              items: findOrder.items.concat(items),
              totalPrice: findOrder.totalPrice + totalPrice,
            },
          },
          { new: true }
        );

        // Yangilangan buyurtmani yuborish
        io.to(restaurantId).emit("get_order_update", order);
        if (assignedWaiter) {
          io.to(assignedWaiter._id.toString()).emit("get_order_update", order);
        }
        return socket.emit("order_response", { status: 200, order });
      } else {
        const order = await orderModel.create({
          restaurantId,
          tableNumber,
          items,
          totalPrice: finalPrice,
          promoCode: promoCode || null,
          waiter: assignedWaiter
            ? { id: assignedWaiter._id, name: assignedWaiter.username }
            : { id: null },
        });

        const create = await order.save();

        // Yangi buyurtmani yuborish
        io.to(restaurantId).emit("get_new_order", create);
        if (assignedWaiter) {
          io.to(assignedWaiter._id.toString()).emit("get_order_update", create);
        }
        return socket.emit("order_response", { status: 200, order: create });
      }
    } catch (error) {
      return socket.emit("order_response", {
        status: 500,
        message: "Buyurtma yaratishda xatolik yuz berdi",
        error: error.message,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

module.exports = { httpServer, io };
// API yo'llari
app.post(
  "/api/orders/create-order",
  authMiddleware,
  orderController.createOrder(io)
);
app.use("/api", routes);

// Xatoliklarni qayta ishlash middleware'i
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", details: err.message });
});

// 404 xatoligi uchun middleware
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Vercel uchun

// Local ishga tushirish
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
