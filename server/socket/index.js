const { Server, Socket } = require("socket.io")
const { notificationSocket } = require("./notificationSocket.js")


const onlineUsers = new Map()

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
  })

  io.use((socket, next) => {
    const userID = socket.handshake.query.userID; // lấy userID client gửi
    if (!userID) {
      console.log("⚠️ Missing userID in handshake query");
      return next(new Error("Missing userID"));
    }
    socket.userID = userID; // GẮN userID vào socket
    next();
  });

  io.on("connection", (socket) => {
    console.log(`User connected:: ${socket.userID}`)
     onlineUsers.set(socket.userID, socket.id)
    notificationSocket(io, socket);
    socket.on("disconnection", () => {
      console.log(`User disconnected: ${socket.userID}`)
    })
  })
  return io;
}

module.exports = {initSocket, onlineUsers}

