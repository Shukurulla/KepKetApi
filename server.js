require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./src/routes");
const errorMiddleware = require("./src/middlewares/error.middleware");
const logger = require("./src/utils/logger");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");

const app = express();

app.use(express.json());

mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => logger.error("MongoDB ga ulanishda xatolik:", err));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"], // Faqat ma'lum metodlarga ruxsat berish
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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
