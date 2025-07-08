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

// CORS konfiguratsiyasi - BARCHA URLlar uchun ochiq
const corsOptions = {
  origin: "*", // Barcha originlarni qabul qilish
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200, // Legacy browser support
};

app.use(cors(corsOptions));

// Socket.IO konfiguratsiyasi - BARCHA URLlar uchun ochiq
const io = socketIo(server, {
  cors: {
    origin: "*", // Barcha originlarni qabul qilish
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
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

  // Waiter ulanishini qayd qilish - Enhanced
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

      // Waiterga connection tasdiqlash
      socket.emit("waiter_connected_success", {
        waiterId: waiterId,
        restaurantId: restaurantId,
        socketId: socket.id,
      });
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

  // Enhanced get_new_order event
  socket.on("get_new_order", (orderData) => {
    console.log("📋 get_new_order received:", orderData);

    const { waiter, restaurantId } = orderData;

    if (waiter && waiter.id) {
      const waiterSocketId = connectedWaiters.get(waiter.id);
      if (waiterSocketId) {
        io.to(waiterSocketId).emit("get_new_order", orderData);
        io.to(waiterSocketId).emit("get_notification", orderData);
      }
      io.to(`waiter_${waiter.id}`).emit("get_new_order", orderData);
    }

    if (restaurantId) {
      io.to(`restaurant_${restaurantId}`).emit("get_new_order", orderData);
    }
  });

  // Notification acceptance from waiter
  socket.on("notification_accepted", (data) => {
    console.log("✅ Notification accepted:", data);

    const { notificationId, waiterId } = data;
    const waiterInfo = connectedSockets.get(socket.id);

    if (waiterInfo && waiterInfo.restaurantId) {
      // Notify admin panel that waiter accepted
      io.to(`restaurant_${waiterInfo.restaurantId}`).emit(
        "notification_accepted",
        {
          notificationId,
          waiterId,
          timestamp: new Date().toISOString(),
        }
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

  // Test connection
  socket.on("test_connection", () => {
    console.log("🧪 Test connection from:", socket.id);
    socket.emit("test_response", {
      message: "Connection successful",
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  // Disconnect hodisasi
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket uzildi: ${socket.id}, Sabab: ${reason}`);

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

  // Heartbeat for connection monitoring
  socket.on("ping", () => {
    socket.emit("pong", {
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
  });
});

// Express middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Additional CORS headers middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,OPTIONS,PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint - Enhanced
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    connectedWaiters: Array.from(connectedWaiters.keys()),
    connectedRestaurants: Array.from(connectedRestaurants.keys()),
    totalConnections: connectedSockets.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Socket status endpoint
app.get("/socket-status", (req, res) => {
  res.json({
    totalConnections: io.engine.clientsCount,
    connectedWaiters: Array.from(connectedWaiters.entries()),
    connectedRestaurants: Array.from(connectedRestaurants.entries()),
    socketDetails: Array.from(connectedSockets.entries()),
  });
});

// Test endpoint for socket connectivity
app.post("/test-socket", (req, res) => {
  const { waiterId, restaurantId, message } = req.body;

  if (waiterId) {
    io.to(`waiter_${waiterId}`).emit("test_message", {
      message: message || "Test message from server",
      timestamp: new Date().toISOString(),
    });
  }

  if (restaurantId) {
    io.to(`restaurant_${restaurantId}`).emit("test_message", {
      message: message || "Test message from server",
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: "Test message sent",
    targets: { waiterId, restaurantId },
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

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Server ${PORT} portda ishga tushdi`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket Status: http://localhost:${PORT}/socket-status`);
  console.log(`🌍 CORS: Barcha URLlar uchun ochiq`);
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

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("💀 Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("💀 Process terminated");
  });
});
