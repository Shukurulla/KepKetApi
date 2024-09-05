require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./src/routes");
const errorMiddleware = require("./src/middlewares/error.middleware");
const logger = require("./src/utils/logger");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const http = require("http");
const { Server } = require("socket.io");
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => logger.error("MongoDB ga ulanishda xatolik:", err));

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("post_order", async (data) => {
    try {
      const orders = await orderModel.create(data);
      if (orders) {
        socket.broadcast.emit("get_order", orders);
      }
    } catch (error) {}
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
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
