require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const notificationModel = require("./src/models/notification.model.js");
const orderModel = require("./src/models/order.model.js");
const waiterModel = require("./src/models/waiter.model.js"); // waiterModel importini qo'shish
const serviceAccountKey = require("./serviceAccountKey.json");
const routes = require("./src/routes");

// Firebase service account kalitini ko'rsatish
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  databaseURL: process.env.FIREBASE_DATABASE_URL, // Firebase Realtime Database URL
});

const app = express();
const server = http.createServer(app);
app.use(express.json());

// MongoDB bilan ulanish
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => console.error("MongoDB ga ulanishda xatolik:", err));

// Socket.io ni o'rnatish
const io = new Server(server, {
  cors: {
    origin: "*", // Har qanday manzilni qabul qilish
    optionsSuccessStatus: 200, // 200 statusini qaytarish
    credentials: true, // Asosiy ma'lumotlar bilan kelish
  },
});

// API yo'llari
app.use("/api", routes);

// Socket.io ulanishi
io.on("connection", (socket) => {
  console.log("A user connected");

  // Waiter ulanganda uning ID sini saqlab qo'yish
  socket.on("waiter_connected", (waiterId) => {
    console.log(`Ofitsiant ulandi: ${waiterId} | Socket ID: ${socket.id}`);
    socket.join(waiterId); // Ofitsiantni uning ID si bo'yicha xonaga qo'shish
  });

  socket.on("send_notification", async (schema) => {
    try {
      const { orderId, meals } = schema;
      io.to(schema.waiter.id).emit("get_notification", schema);

      // Buyurtma topish
      const findOrder = await orderModel.findById(orderId);
      if (!findOrder) {
        return; // Agar buyurtma topilmasa, xatolikni qaytarish
      }

      // Bildirishnoma yaratish
      const notification = await notificationModel.create(schema);

      // Buyurtmani yangilash
      await orderModel.findByIdAndUpdate(orderId, {
        prepared: findOrder.prepared.concat(meals),
      });

      if (notification) {
        // Ofitsiantni yangilash
        await waiterModel.findByIdAndUpdate(
          notification.waiter.id,
          { $set: { busy: true } },
          { new: true }
        );

        // Bildirishnomani waiter ga yuborish
      }
    } catch (error) {
      console.error(error); // Xatolikni konsolga chiqarish
    }
  });

  socket.on("chef_connected", (chefId) => {
    console.log(`Chef ulandi: ${chefId} | Socket ID: ${socket.id}`);
    socket.join(chefId); // Ofitsiantni uning ID si bo'yicha xonaga qo'shish
  });
});

module.exports = io;

// API uchun port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishga tushdi`);
});
