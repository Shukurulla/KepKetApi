require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./src/routes");
const errorMiddleware = require("./src/middlewares/error.middleware");
const logger = require("./src/utils/logger");
const http = require("http");
const { Server } = require("socket.io");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const { createOrder } = require("./src/controllers/order.controller");
const waiterModel = require("./src/models/waiter.model");
const notificationModel = require("./src/models/notification.model");
const orderModel = require("./src/models/order.model");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"], // Faqat ma'lum metodlarga ruxsat berish
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => logger.error("MongoDB ga ulanishda xatolik:", err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"], // Faqat ma'lum metodlarga ruxsat berish
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("create_order", async (data) => {
    try {
      const req = {
        body: data,
      };
      const res = {
        status: (statusCode) => ({
          json: (response) => {
            socket.emit("order_response", { statusCode, response });
          },
        }),
      };

      await createOrder(req, res);
    } catch (error) {}
  });
  let notifications;
  socket.on("create_notification", async (data) => {
    try {
      const notification = await notificationModel.create(data);
      console.log("Yangi bildirishnoma:", notification);
      notifications = notification;

      // Ofitsiantga xabar yuborish
      io.to(data.waiter.id).emit("get_notification", notification);
    } catch (error) {
      console.error("Bildirishnoma yaratishda xatolik:", error);
    }
  });
  socket.on("all_orders", async (data) => {
    const allOrders = await orderModel.find();
    const filterOrders = allOrders.filter((c) => c.restaurantId == data);
    socket.emit("get_orders", filterOrders);
  });
  // Ofitsiant sahifasida ID bilan ulanish
  socket.on("waiter_connected", async (waiterId) => {
    socket.join(waiterId);
    socket.to(waiterId).emit("get", notifications);
    notifications = "";
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server ${PORT} portda ishga tushdi`);
});

// Tizimni to'xtatish signallarini qayta ishlash
process.on("SIGTERM", () => {
  logger.info("SIGTERM signali qabul qilindi. Serverning ishini tugatish...");
  app.close(() => {
    logger.info("Server toxtatildi");
    process.exit(0);
  });
});
