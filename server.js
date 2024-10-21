require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const routes = require("./src/routes");

const app = express();

// CORS sozlamalari
const corsOptions = {
  origin: ["http://localhost:5173", "https://your-frontend-domain.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

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
  })
  .then(() => console.log("MongoDB ga muvaffaqiyatli ulandi"))
  .catch((err) => console.error("MongoDB ga ulanishda xatolik:", err));

// HTTP server
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  // Boshqa Socket.IO hodisalari...
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
module.exports = app;
module.exports = io;

// Local ishga tushirish
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
