require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const notificationModel = require("./src/models/notification.model.js");
const orderModel = require("./src/models/order.model.js");
// Firebase service account kalitini ko'rsatish

// Firebase ni ishga tushirish
const acc = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URI,
  client_x509_cert_url: process.env.CLIENT_X509_CER_URI,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};
console.log(acc);

admin.initializeApp({
  credential: admin.credential.cert(acc),
  databaseURL: process.env.FIREBASE_DATABASE_URL, // Firebase Realtime Database URL
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// MongoDB bilan ulanish
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => console.error("MongoDB ga ulanishda xatolik:", err));

// Socket.io ulanishi
io.on("connection", (socket) => {
  // Xabarni qabul qilish
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
        return res.status(400).json({ message: "Order ID topilmadi" });
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
    } catch (error) {}
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
