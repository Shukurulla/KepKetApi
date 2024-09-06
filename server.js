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
    origin: "*", // Frontend URL ni ruxsat bering
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
  socket.on("create_notification", async (data) => {
    try {
      const notification = await waiterModel.findByIdAndUpdate(
        data.waiterId,
        {
          $set: { notification: data, complated: false },
        },
        { new: true }
      );
      socket.to(data.waiterId).emit("get_notification", notification);
    } catch (error) {}
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
