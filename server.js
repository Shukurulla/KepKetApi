require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const notificationModel = require("./src/models/notification.model.js");
const orderModel = require("./src/models/order.model.js");
const waiterModel = require("./src/models/waiter.model.js");
const serviceAccountKey = require("./serviceAccountKey.json");

// Import routes
const routes = require("./src/routes");

// Firebase service account kalitini ko'rsatish
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const app = express();

// CORS sozlamalari
const corsOptions = {
  origin: ["http://localhost:5173", "https://your-frontend-domain.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB bilan ulanish
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => console.error("MongoDB ga ulanishda xatolik:", err));

// HTTP server yaratish
const server = http.createServer(app);

// Socket.io ni o'rnatish
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// Socket.io hodisalarini o'rnatish
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("waiter_connected", (waiterId) => {
    console.log(`Ofitsiant ulandi: ${waiterId} | Socket ID: ${socket.id}`);
    socket.join(waiterId);
  });

  socket.on("send_notification", async (schema) => {
    try {
      const { orderId, meals } = schema;
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
      console.error(error);
    }
  });

  socket.on("chef_connected", (chefId) => {
    console.log(`Chef ulandi: ${chefId} | Socket ID: ${socket.id}`);
    socket.join(chefId);
  });
});

// API yo'llari
app.use("/api", routes);

// Xatoliklarni qayta ishlash middleware'i
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Vercel'ga mos keladigan eksport
module.exports = app;
module.exports = io;
// Serverni o'qitish (localhostda ishga tushirish uchun)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server localhostda ${PORT} portida ishga tushmoqda...`);
  });
}
