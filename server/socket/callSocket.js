// file: server/socketHandlers/callHandler.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

function callHandler(io, socket) {
  // ====== lấy token giống như chatSocket =======
  const getTokenFromSocket = (socket) => {
    const t1 = socket.handshake?.auth?.token;
    if (t1) return t1;

    const authHeader =
      socket.handshake?.headers?.authorization ||
      socket.handshake?.headers?.Authorization;

    if (!authHeader) return null;

    const parts = String(authHeader).split(" ");
    return parts.length === 2 ? parts[1] : null;
  };

  let userId = null;
  try {
    const token = getTokenFromSocket(socket);
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      userId =
        payload?.id ??
        payload?._id ??
        payload?.userId ??
        payload?.userID ??
        null;
    }
  } catch (err) {
    console.warn("CallSocket token error:", err?.message);
  }

  socket.userID = userId ? String(userId) : null;
  console.log("📞 CallSocket connected userID:", socket.userID);

  if (!socket.userID) {
    socket.emit("tokenExpired");
    socket.disconnect();
    return;
  }

  // ====== join room theo userId (quan trọng) =======
  socket.join(socket.userID);
  console.log("📌 Joined call room:", socket.userID);

  // ==========================
  // 📞 INITIATE CALL
  // ==========================
  socket.on("call:initiate", async ({ to, from, callType, offer }) => {
    try {
      const fromId = String(from || socket.userID || "");
      console.log(`📞 Call from ${fromId} → ${to}`);

      if (!to) return socket.emit("call:error", { message: "Missing 'to' id" });
      if (!fromId) return socket.emit("call:error", { message: "Missing caller id" });

      // 👇 Không tìm socketId nữa — emit tới ROOM người nhận
      const caller = await User.findById(fromId).select("fullname avatar");

      const payload = {
        from: fromId,
        fromName: caller?.fullname || "Unknown",
        fromAvatar: caller?.avatar,
        callType,
        offer,
      };

      console.log("📤 call:incoming →", to);
      io.to(String(to)).emit("call:incoming", payload);

      socket.emit("call:sending", { to, status: "sent" });
    } catch (err) {
      console.error("call:initiate error:", err);
      socket.emit("call:error", { message: "Call initiate error" });
    }
  });

  // ==========================
  // 📲 ACCEPT CALL
  // ==========================
  socket.on("call:accept", ({ to, answer }) => {
    console.log(`📞 ${socket.userID} accepted call from ${to}`);

    io.to(String(to)).emit("call:accepted", {
      from: socket.userID,
      answer,
    });
  });

  // ==========================
  // 📲 ACK RECEIVED
  // ==========================
  socket.on("call:ack", ({ to }) => {
    console.log(`ACK: ${socket.userID} → ${to}`);
    io.to(String(to)).emit("call:ack-received", {
      from: socket.userID,
      status: "received",
    });
  });

  // ==========================
  // ❌ REJECT CALL
  // ==========================
  socket.on("call:reject", ({ to }) => {
    console.log(`❌ Call rejected by ${socket.userID}`);
    io.to(String(to)).emit("call:rejected", {
      from: socket.userID,
    });
  });

  // ==========================
  // 🔚 END CALL
  // ==========================
  socket.on("call:end", ({ to }) => {
    console.log(`🔚 Call ended by ${socket.userID}`);
    io.to(String(to)).emit("call:ended", {
      from: socket.userID,
    });
  });

  // ==========================
  // ❄ ICE CANDIDATE
  // ==========================
  socket.on("call:ice-candidate", ({ to, candidate }) => {
    io.to(String(to)).emit("call:ice-candidate", {
      from: socket.userID,
      candidate,
    });
  });

  // ==========================
  // 🎤 MUTE/UNMUTE
  // ==========================
  socket.on("call:toggle-audio", ({ to, enabled }) => {
    io.to(String(to)).emit("call:audio-toggled", {
      from: socket.userID,
      enabled,
    });
  });

  // ==========================
  // 🎥 CAMERA ON/OFF
  // ==========================
  socket.on("call:toggle-video", ({ to, enabled }) => {
    io.to(String(to)).emit("call:video-toggled", {
      from: socket.userID,
      enabled,
    });
  });
}

module.exports = callHandler;
