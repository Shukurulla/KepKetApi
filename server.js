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
const notificationModel = require("./src/models/notification.model.js");

// CORS sozlamalari

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://unify-liard.vercel.app",
  "https://kep-ket-admin.vercel.app",
  "https://your-frontend-domain.com", // Frontend domeningizni qo'shing
];

const corsOptions = {
  origin: allowedOrigins,
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(
  cors({
    origin: allowedOrigins,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
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
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => console.error("MongoDB ga ulanishda xatolik:", err));

// Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  allowEIO3: true,
  transports: ["polling", "websocket"],
  maxHttpBufferSize: 1e8,
});

io.engine.on("connection_error", (err) => {
  console.log("Connection error details:");
  console.log("Error code:", err.code);
  console.log("Error message:", err.message);
  console.log("Error context:", err.context);
});
// Socket.IO handlers
const setupSocketHandlers = (io) => {
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

        const findOrder = await orderModel.findById(orderId);

        if (!findOrder) return;

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
          await io
            .to(schema.restaurantId)
            .emit("get_notification", notification);
          await io.to(schema.waiter.id).emit("get_notification", notification);
        }
      } catch (error) {
        console.error("Notification error:", error);
      }
    });

    socket.on("send_order", async (orderData) => {
      try {
        const { restaurantId, totalPrice, tableNumber, items, promoCode } =
          orderData;

        io.to(restaurantId).emit("get_new_order", orderData);

        const restaurant = await restaurantModel.findById(restaurantId);
        if (!restaurant) {
          return socket.emit("order_response", {
            status: 400,
            message: "Restoran topilmadi",
          });
        }

        const table = await tableModel.findById(tableNumber.id);
        if (!table) {
          return socket.emit("order_response", {
            status: 400,
            message: "Bunday stol topilmadi",
          });
        }

        let finalPrice = totalPrice;

        if (promoCode) {
          const getPromoCode = await promoCodeModel.findById(promoCode);
          if (!getPromoCode) {
            return socket.emit("order_response", {
              status: 400,
              message: "Bunday PromoCode topilmadi",
            });
          }

          if (getPromoCode.worked) {
            return socket.emit("order_response", {
              status: 400,
              message: "Bu kod oldin ishlatilgan",
            });
          }

          finalPrice -= getPromoCode.discount || 0;
        }

        const waitersRestaurant = await waiterModel.find({ restaurantId });
        const availableWaiters = waitersRestaurant.filter(
          (c) => c.busy === false
        );
        let assignedWaiter = null;

        if (availableWaiters.length > 0) {
          assignedWaiter =
            availableWaiters[
              Math.floor(Math.random() * availableWaiters.length)
            ];
        } else {
          const allWaiters = await waiterModel.find({ restaurantId });
          if (allWaiters.length > 0) {
            assignedWaiter =
              allWaiters[Math.floor(Math.random() * allWaiters.length)];
          }
        }

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

          io.to(restaurantId).emit("get_order_update", order);
          if (assignedWaiter) {
            io.to(assignedWaiter._id.toString()).emit(
              "get_order_update",
              order
            );
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

          io.to(restaurantId).emit("get_new_order", create);
          if (assignedWaiter) {
            io.to(assignedWaiter._id.toString()).emit(
              "get_order_update",
              create
            );
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
};

setupSocketHandlers(io);

// API routes
app.post(
  "/api/orders/create-order",
  authMiddleware,
  orderController.createOrder(io)
);
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", details: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

const PORT = process.env.PORT || 1234;
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
