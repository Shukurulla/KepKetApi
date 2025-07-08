require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const routes = require("./src/routes");
const errorMiddleware = require("./src/middlewares/error.middleware");
const logger = require("./src/utils/logger");
const connectDB = require("./src/config/database");

const app = express();
const server = http.createServer(app);

// CORS konfiguratsiyasi
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://unify-liard.vercel.app/",
    "https://kepket-admin.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Socket.IO konfiguratsiyasi
const io = socketIo(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// Socket.IO eventlarini boshqarish
const connectedWaiters = new Map(); // waiterId -> socketId mapping
const connectedRestaurants = new Map(); // restaurantId -> socketId mapping
const connectedSockets = new Map(); // socketId -> user info mapping

io.on("connection", (socket) => {
  console.log(`🔌 Yangi socket ulandi: ${socket.id}`);

  // Restaurant owner ulanishini qayd qilish
  socket.on("restaurant_connected", (restaurantId) => {
    console.log(`🏪 Restaurant ${restaurantId} ulandi`);
    socket.join(`restaurant_${restaurantId}`);
    socket.join(restaurantId); // Old format support

    connectedRestaurants.set(restaurantId, socket.id);
    connectedSockets.set(socket.id, {
      restaurantId: restaurantId,
      type: "restaurant",
    });
  });

  // Restaurant room ga qo'shilish
  socket.on("join_restaurant", (restaurantId) => {
    console.log(`🏪 Joining restaurant room: ${restaurantId}`);
    socket.join(`restaurant_${restaurantId}`);
    socket.join(restaurantId);
  });

  // Chef ulanishini qayd qilish
  socket.on("chef_connected", (userId) => {
    console.log(`👨‍🍳 Chef ${userId} ulandi`);
    socket.join(`chef_${userId}`);
    socket.join(`restaurant_${userId}`);

    connectedSockets.set(socket.id, {
      userId: userId,
      type: "chef",
    });
  });

  // Waiter ulanishini qayd qilish
  socket.on("waiter_connected", (data) => {
    console.log("👨‍💼 Waiter ulandi:", data);

    let waiterId, restaurantId;

    // Data object yoki string bo'lishi mumkin
    if (typeof data === "object" && data.waiterId) {
      waiterId = data.waiterId;
      restaurantId = data.restaurantId;
    } else if (typeof data === "string") {
      waiterId = data;
      // RestaurantId ni boshqa yo'l bilan olishga harakat qilamiz
    }

    if (waiterId) {
      connectedWaiters.set(waiterId, socket.id);
      connectedSockets.set(socket.id, {
        waiterId: waiterId,
        restaurantId: restaurantId,
        type: "waiter",
      });

      socket.join(`waiter_${waiterId}`);
      if (restaurantId) {
        socket.join(`restaurant_${restaurantId}`);
      }

      console.log(`✅ Waiter ${waiterId} registered with socket ${socket.id}`);
    }
  });

  // Notification yuborish - Admin paneldan keladi
  socket.on("send_notification", (notificationData) => {
    console.log("🔔 send_notification received:", notificationData);

    const { waiter, restaurantId } = notificationData;

    // Waiter loyihasi uchun formatlanган notification
    const waiterNotification = {
      _id: `notification_${Date.now()}`,
      id: `notification_${Date.now()}`,
      tableNumber: notificationData.table?.number || 0,
      table: notificationData.table,
      customerName: "Mijoz",
      items:
        notificationData.meals?.map((meal) => ({
          dish: {
            name: meal.foodName,
            id: meal.foodId,
            price: meal.foodPrice,
            image: meal.foodImage,
          },
          quantity: meal.quantity,
          price: meal.foodPrice,
          name: meal.foodName,
          foodName: meal.foodName,
        })) || [],
      meals: notificationData.meals || [],
      totalPrice: notificationData.totalPrice || 0,
      time: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString(),
      status: "pending",
      waiter: waiter,
      restaurantId: restaurantId,
    };

    // Waiterga multiple event nomlari bilan yuborish
    if (waiter && waiter.id) {
      const waiterSocketId = connectedWaiters.get(waiter.id);
      console.log(
        `📤 Sending to waiter ${waiter.id}, socket: ${waiterSocketId}`
      );

      if (waiterSocketId) {
        io.to(waiterSocketId).emit("get_notification", waiterNotification);
        io.to(waiterSocketId).emit("get_new_order", waiterNotification);
        io.to(waiterSocketId).emit("notification", waiterNotification);
        io.to(waiterSocketId).emit("waiter_notification", waiterNotification);
      }

      // Room orqali ham yuborish
      io.to(`waiter_${waiter.id}`).emit("get_notification", waiterNotification);
      io.to(`waiter_${waiter.id}`).emit("get_new_order", waiterNotification);
    }

    // Restaurant owneriga yuborish
    if (restaurantId) {
      io.to(`restaurant_${restaurantId}`).emit(
        "get_notification",
        notificationData
      );
      io.to(restaurantId).emit("get_notification", waiterNotification);
    }

    console.log(`✅ Notification processed for waiter ${waiter?.id}`);
  });

  // Direct notification - waiter loyihasidan kelishi mumkin
  socket.on("get_notification", (notificationData) => {
    console.log("🔔 get_notification received:", notificationData);

    const { waiter, restaurantId } = notificationData;

    if (waiter && waiter.id) {
      const waiterSocketId = connectedWaiters.get(waiter.id);
      if (waiterSocketId && waiterSocketId !== socket.id) {
        io.to(waiterSocketId).emit("get_notification", notificationData);
        io.to(waiterSocketId).emit("notification", notificationData);
      }
    }

    if (restaurantId) {
      io.to(`restaurant_${restaurantId}`).emit(
        "get_notification",
        notificationData
      );
    }
  });

  // Order status yangilash
  socket.on("update_order_status", async (data) => {
    console.log("🔄 Order status yangilanmoqda:", data);

    try {
      const { orderId, status, waiterId } = data;

      // Buyurtmani bazadan topish va yangilash
      const orderModel = require("./src/models/order.model");
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );

      if (updatedOrder) {
        // Barcha restaurant memberlariga yuborish
        io.to(`restaurant_${updatedOrder.restaurantId}`).emit(
          "get_order_update",
          updatedOrder
        );

        // Waiterga yuborish
        if (waiterId) {
          io.to(`waiter_${waiterId}`).emit("get_order_update", updatedOrder);
        }

        console.log(`✅ Order ${orderId} status updated to ${status}`);
      }
    } catch (error) {
      console.error("❌ Order status yangilashda xatolik:", error);
    }
  });

  // Yangi buyurtma yaratilganda
  socket.on("create_order", async (orderData) => {
    console.log("📋 Yangi buyurtma yaratilmoqda:", orderData);

    try {
      const { restaurantId, waiter } = orderData;

      // Agar waiter tayinlangan bo'lsa, faqat unga yuborish
      if (waiter && waiter.id) {
        const waiterSocketId = connectedWaiters.get(waiter.id);
        if (waiterSocketId) {
          io.to(waiterSocketId).emit("get_new_order", orderData);
        }
        io.to(`waiter_${waiter.id}`).emit("get_new_order", orderData);
      }

      // Restaurant owneriga ham yuborish
      io.to(`restaurant_${restaurantId}`).emit("get_new_order", orderData);
    } catch (error) {
      console.error("❌ Buyurtma yaratishda xatolik:", error);
    }
  });

  // Disconnect hodisasi
  socket.on("disconnect", () => {
    console.log(`🔌 Socket uzildi: ${socket.id}`);

    const socketInfo = connectedSockets.get(socket.id);
    if (socketInfo) {
      if (socketInfo.waiterId) {
        connectedWaiters.delete(socketInfo.waiterId);
        console.log(`👨‍💼 Waiter ${socketInfo.waiterId} disconnected`);
      }
      if (socketInfo.restaurantId && socketInfo.type === "restaurant") {
        connectedRestaurants.delete(socketInfo.restaurantId);
        console.log(`🏪 Restaurant ${socketInfo.restaurantId} disconnected`);
      }
    }
    connectedSockets.delete(socket.id);
  });

  // Debug info
  socket.on("get_connected_users", () => {
    socket.emit("connected_users", {
      waiters: Array.from(connectedWaiters.keys()),
      restaurants: Array.from(connectedRestaurants.keys()),
      totalSockets: connectedSockets.size,
    });
  });
});

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    connectedWaiters: Array.from(connectedWaiters.keys()),
    connectedRestaurants: Array.from(connectedRestaurants.keys()),
  });
});

// API routes
app.use("/api", routes);

// Error handling middleware
app.use(errorMiddleware);

// Socket.IO ni global qilish (controllerlar uchun)
global.io = io;
module.exports = { io };

// Database connection
connectDB();

const PORT = process.env.PORT || 1234;

server.listen(PORT, () => {
  logger.info(`🚀 Server ${PORT} portda ishga tushdi`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

// Unhandled promise rejection
process.on("unhandledRejection", (err, promise) => {
  logger.error("Unhandled Promise Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});

// Uncaught exception
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});
