const { Server } = require("socket.io");
const { notificationSocket } = require("./notificationSocket"); // nếu bạn dùng cái này
const {chatSocket} = require("./chatSocket")
const callHandler = require("./callSocket");
const onlineUsers = new Map();

let io 
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true, // Nên để true nếu client có gửi cookie/token
    },
  });

  const jwt = require('jsonwebtoken');

  io.use((socket, next) => {
    try {
      // Prefer explicit query userID
      let userID = socket.handshake?.query?.userID;

      // If not present, try to decode from auth token or Authorization header
      if (!userID) {
        const token = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization;
        if (token) {
          // token may be prefixed with "Bearer "
          const t = String(token).startsWith('Bearer ') ? String(token).split(' ')[1] : token;
          try {
            const payload = jwt.verify(t, process.env.JWT_SECRET);
            userID = payload?.id ?? payload?._id ?? payload?.userId ?? payload?.userID ?? null;
          } catch (err) {
            console.warn('Socket auth token verify failed:', err?.message || err);
          }
        }
      }

      if (!userID) {
        console.log('⚠️ Missing userID in handshake (query or token)');
        return next(new Error('Missing userID'));
      }

      // Normalize userID to string to avoid mismatches between number/ObjectId and string keys
      socket.userID = String(userID);
      next();
    } catch (err) {
      console.error('Error in socket auth middleware:', err);
      return next(new Error('Socket auth error'));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userID}`);

    console.log(`✅ socket connected: ${socket.id}`);
    
    // store as string key
    onlineUsers.set(String(socket.userID), socket.id);


    // gọi handler phụ
    notificationSocket(io, socket);
    callHandler(io, socket, onlineUsers);
    chatSocket(io, socket)
    
    
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userID}`);
      onlineUsers.delete(socket.userID);
    });
    (io);
  });

  return io;
}
function getIO() {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo!");
  }
  return io;
}
module.exports = { initSocket, getIO, onlineUsers };
