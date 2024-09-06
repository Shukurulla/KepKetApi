import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Socket.io server is starting...");
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("create_order", async (data) => {
        // Your create order logic here
      });

      // Other socket event handlers
    });

    res.socket.server.io = io;
  }
  res.end();
}
