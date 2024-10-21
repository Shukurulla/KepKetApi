require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const routes = require("./src/routes");
const orderModel = require("./src/models/order.model.js");
const notificationModel = require("./src/models/notification.model.js");
const waiterModel = require("./src/models/waiter.model.js");

const app = express();
const httpServer = createServer(app);

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

module.exports = { io };

// Socket.IO ulanish hodisasi
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
});

// API yo'llari
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

// Vercel uchun export
module.exports = httpServer;

// Local ishga tushirish
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
