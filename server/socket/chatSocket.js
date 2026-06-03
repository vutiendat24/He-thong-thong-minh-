const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const driver = require("../config/Neo4jConf").driver;

async function chatSocket(io, socket) {
  // giữ số lượng socket theo user để hỗ trợ nhiều tab
  const userSocketCount = {};
  const userDisconnectTimers = new Map();
  const OFFLINE_DELAY_MS = 60000; // 60s

  // expose helper để các route khác (ví dụ logout) có thể hủy timer đang chờ
  io.presence = {
    clearDisconnectTimer: (userID) => {
      try {
        const t = userDisconnectTimers.get(String(userID));
        if (t) {
          clearTimeout(t);
          userDisconnectTimers.delete(String(userID));
        }
      } catch (e) {
        console.warn("clearDisconnectTimer lỗi:", e?.message || e);
      }
    },
  };

  // helper: lấy token từ handshake (auth hoặc header)
  const getTokenFromSocket = (socket) => {
    const t1 = socket.handshake?.auth?.token;
    if (t1) return t1;
    const authHeader = socket.handshake?.headers?.authorization || socket.handshake?.headers?.Authorization;
    if (!authHeader) return null;
    const parts = String(authHeader).split(" ");
    return parts.length === 2 ? parts[1] : null;
  };

  // helper: lấy danh sách id bạn bè từ Neo4j
  const getFriendIds = async (userID) => {
    try {
      const session = driver.session();
      const res = await session.run(
        `MATCH (u:User {id: $id})-[:FRIEND_WITH]-(f:User) RETURN f.id AS id`,
        { id: String(userID) }
      );
      const ids = res.records.map(r => r.get("id"));
      await session.close();
      return ids;
    } catch (e) {
      console.warn("getFriendIds lỗi:", e?.message || e);
      return [];
    }
  };

  // 🟢 GIẢI MÃ TOKEN
  let userID = null;
  try {
    const token = getTokenFromSocket(socket);
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        userID = payload?.id ?? payload?._id ?? payload?.userID?? payload?.userID ?? null;
      } catch (err) {
        if (err && err.name === "TokenExpiredError") {
          socket.emit("tokenExpired", { message: "Token expired" });
          socket.disconnect(true);
          return;
        }
        console.warn("Xác thực token socket thất bại:", err?.message || err);
      }
    }
  } catch (e) {
    console.warn("Phân tích auth socket thất bại:", e?.message || e);
  }

  socket.userID = userID ? String(userID) : null;
  console.log("✅ ChatSocket kết nối userID:", socket.userID);

  // quản lý bộ đếm kết nối
  if (socket.userID ) {
    const pending = userDisconnectTimers.get(socket.userID );
    if (pending) { clearTimeout(pending); userDisconnectTimers.delete(socket.userID ); }

    userSocketCount[socket.userID ] = (userSocketCount[socket.userID ] || 0) + 1;

    if (userSocketCount[socket.userID ] === 1) {
      User.findByIdAndUpdate(socket.userID , { online: true }).catch(()=>{});
      getFriendIds(socket.userID ).then(friendIds => {
        friendIds.forEach(fid =>
          io.to(String(fid)).emit("friendOnline", { userID: socket.userID , online: true })
        );
      });
    }

    socket.join(socket.userID );
  }

  // 🟢 JOIN ROOM
  socket.on("join", (roomId) => {
    socket.join(String(roomId));
  });

  // 🟢 NHẬN TIN NHẮN
  socket.on("sendMessage", async ({ receiverId, content, conversationId }) => {
    try {
      const senderId = socket.userID ;
      if (!senderId) return socket.emit("errorMessage", { message: "Unauthorized" });
      if (!receiverId || !content)
        return socket.emit("errorMessage", { message: "Invalid payload" });

      const sId = mongoose.Types.ObjectId.isValid(String(senderId))
        ? new mongoose.Types.ObjectId(String(senderId))
        : senderId;
      const rId = mongoose.Types.ObjectId.isValid(String(receiverId))
        ? new mongoose.Types.ObjectId(String(receiverId))
        : receiverId;

      let conv = null;
      if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
        conv = await Conversation.findById(conversationId);
      }
      if (!conv) {
        conv = await Conversation.findOne({ participants: { $all: [sId, rId] } });
        if (!conv) {
          conv = new Conversation({ participants: [sId, rId], createdAt: Date.now(), updatedAt: Date.now() });
          await conv.save();
        }
      }

      const message = new Message({
        conversationId: conv._id,
        senderId: sId,
        receiverId: rId,
        content,
        createdAt: new Date(),
      });
      await message.save();

      conv.lastMessage = content;
      conv.lastSender = sId;
      conv.updatedAt = new Date();
      await conv.save();

      const populated = await Message.findById(message._id)
        .populate({ path: "senderId", select: "_id fullname email avatar" })
        .lean();

      io.to(String(senderId)).emit("receiveMessage", populated || message);
      io.to(String(receiverId)).emit("receiveMessage", populated || message);
    } catch (err) {
      console.error("❌ Lỗi xử lý sendMessage (socket):", err);
      socket.emit("errorMessage", { message: "Server error" });
    }
  });

  // 🟢 XỬ LÝ NGẮT KẾT NỐI
  socket.on("disconnect", () => {
    if (socket.userID ) {
      userSocketCount[socket.userID ] = Math.max(0, (userSocketCount[socket.userID ] || 1) - 1);
      if (userSocketCount[socket.userID ] === 0) {
        if (!userDisconnectTimers.has(socket.userID )) {
          const t = setTimeout(async () => {
            await User.findByIdAndUpdate(socket.userID , { online: false, lastSeen: new Date() });
            const friendIds = await getFriendIds(socket.userID );
            friendIds.forEach(fid =>
              io.to(String(fid)).emit("friendOffline", { userID: socket.userID , online: false })
            );
            userDisconnectTimers.delete(socket.userID );
          }, OFFLINE_DELAY_MS); 
          userDisconnectTimers.set(socket.userID , t);
        }
      }
    }
  });
}

module.exports = { chatSocket };
