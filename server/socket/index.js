const { Server } = require("socket.io");
const { notificationSocket } = require("./notificationSocket"); // nếu bạn dùng cái này
const {chatSocket} = require("./chatSocket")
const onlineUsers = new Map();

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true, // Nên để true nếu client có gửi cookie/token
    },
  });

  io.use((socket, next) => {
    const userID = socket.handshake.query.userID;
    if (!userID) {
      console.log("⚠️ Missing userID in handshake query");
      return next(new Error("Missing userID"));
    }
    socket.userID = userID;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userID}`);
    onlineUsers.set(socket.userID, socket.id);

    // gọi handler phụ
    notificationSocket(io, socket);
    chatSocket(io, socket)
    
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userID}`);
      onlineUsers.delete(socket.userID);
    });
  });

  return io;
}

module.exports = { initSocket, onlineUsers };
