const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

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

const server = http.createServer(app);

// Socket.IO sozlamalari
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

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
  res.status(500).send("Something broke!");
});

// Vercel uchun export
module.exports = app;

// Local ishga tushirish uchun
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
