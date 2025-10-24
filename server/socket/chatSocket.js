const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const driver = require("../config/Neo4jConf").driver;

module.exports = (io) => {
  // giữ số lượng socket theo user để hỗ trợ nhiều tab
  const userSocketCount = {};
  // timers để trì hoãn việc chuyển offline khi disconnect (user có thể quay lại nhanh)
  const userDisconnectTimers = new Map();
  const OFFLINE_DELAY_MS = 60000; // 60s - điều chỉnh nếu cần

  // expose helper để các route khác (ví dụ logout) có thể hủy timer đang chờ
  io.presence = {
    clearDisconnectTimer: (userId) => {
      try {
        const t = userDisconnectTimers.get(String(userId));
        if (t) {
          clearTimeout(t);
          userDisconnectTimers.delete(String(userId));
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
  const getFriendIds = async (userId) => {
    try {
      const session = driver.session();
      const res = await session.run(
        `MATCH (u:User {id: $id})-[:FRIEND_WITH]-(f:User) RETURN f.id AS id`,
        { id: String(userId) }
      );
      const ids = res.records.map(r => r.get("id"));
      try { await session.close(); } catch {}
      return ids;
    } catch (e) {
      console.warn("getFriendIds lỗi:", e?.message || e);
      return [];
    }
  };

  io.on("connection", (socket) => {
    // giải mã token (nếu có) và gắn userId lên socket
    let userId = null;
    try {
      const token = getTokenFromSocket(socket);
      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          userId = payload?.id ?? payload?._id ?? payload?.userId ?? null;
        } catch (err) {
          // Nếu token hết hạn, thông báo cho client và ngắt kết nối
          if (err && err.name === "TokenExpiredError") {
            try { socket.emit("tokenExpired", { message: "Token expired" }); } catch {}
            try { socket.disconnect(true); } catch {}
            return; // dừng xử lý kết nối
          }
          console.warn("Xác thực token socket thất bại:", err?.message || err);
        }
      }
    } catch (e) {
      console.warn("Phân tích auth socket thất bại:", e?.message || e);
    }

    socket.userId = userId ? String(userId) : null;

    // quản lý bộ đếm kết nối
    if (socket.userId) {
      // nếu có timer đang chờ (do disconnect trước đó) -> hủy vì user reconnect
      try { 
        const pending = userDisconnectTimers.get(socket.userId);
        if (pending) { clearTimeout(pending); userDisconnectTimers.delete(socket.userId); }
      } catch (e) { /* ignore */ }

      userSocketCount[socket.userId] = (userSocketCount[socket.userId] || 0) + 1;
      // nếu là lần đầu kết nối cho user này, đánh dấu online và thông báo bạn bè
      if (userSocketCount[socket.userId] === 1) {
        User.findByIdAndUpdate(socket.userId, { online: true }).catch(()=>{});
        getFriendIds(socket.userId).then(friendIds => {
          friendIds.forEach(fid => io.to(String(fid)).emit("friendOnline", { userId: socket.userId, online: true }));
        }).catch(()=>{});
      }
      socket.join(socket.userId);
    }

    // cho phép join phòng conversation nếu cần
    socket.on("join", (roomId) => {
      socket.join(String(roomId));
    });

    // nhận sự kiện gửi tin nhắn realtime
    // payload: { receiverId, content, conversationId? }
    socket.on("sendMessage", async ({ receiverId, content, conversationId }) => {
      try {
        const senderId = socket.userId;
        if (!senderId) {
          socket.emit("errorMessage", { message: "Unauthorized" });
          return;
        }
        if (!receiverId || !content) {
          socket.emit("errorMessage", { message: "Invalid payload" });
          return;
        }

        // đảm bảo tạo ObjectId bằng "new" nếu id hợp lệ
        const sId = mongoose.Types.ObjectId.isValid(String(senderId)) ? new mongoose.Types.ObjectId(String(senderId)) : senderId;
        const rId = mongoose.Types.ObjectId.isValid(String(receiverId)) ? new mongoose.Types.ObjectId(String(receiverId)) : receiverId;

        // tìm hoặc tạo conversation
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

        // lưu message vào DB
        const message = new Message({
          conversationId: conv._id,
          senderId: sId,
          receiverId: rId,
          content,
          createdAt: new Date(),
        });
        await message.save();

        // cập nhật conversation
        conv.lastMessage = content;
        conv.lastSender = sId;
        conv.updatedAt = new Date();
        await conv.save();

        // populate sender để emit đầy đủ thông tin
        const populated = await Message.findById(message._id).populate({ path: "senderId", select: "_id fullname email avatar" }).lean();

        // emit tới cả sender & receiver (phòng theo userId)
        io.to(String(senderId)).emit("receiveMessage", populated || message);
        io.to(String(receiverId)).emit("receiveMessage", populated || message);
      } catch (err) {
        console.error("❌ Lỗi xử lý sendMessage (socket):", err);
        socket.emit("errorMessage", { message: "Server error" });
      }
    });

    // (WebRTC / signaling đã bị loại bỏ ở chế độ phục hồi)

    socket.on("disconnect", () => {
      if (socket.userId) {
        userSocketCount[socket.userId] = Math.max(0, (userSocketCount[socket.userId] || 1) - 1);
        // nếu không còn kết nối nào, đặt timeout trước khi đánh dấu offline (để tránh flicker nếu user quay lại nhanh)
        if (userSocketCount[socket.userId] === 0) {
          // tránh đặt nhiều timers cho cùng user
          if (!userDisconnectTimers.has(socket.userId)) {
            const t = setTimeout(async () => {
              try {
                await User.findByIdAndUpdate(socket.userId, { online: false, lastSeen: new Date() });
              } catch (e) { /* ignore */ }
              try {
                const friendIds = await getFriendIds(socket.userId);
                friendIds.forEach(fid => io.to(String(fid)).emit("friendOffline", { userId: socket.userId, online: false }));
              } catch (e) { /* ignore */ }
              userDisconnectTimers.delete(socket.userId);
            }, OFFLINE_DELAY_MS);
            userDisconnectTimers.set(socket.userId, t);
          }
        }
      }
    });
  });
};
