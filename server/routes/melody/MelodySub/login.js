const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {mongoose} = require('../../../config/MongooseConf');
require('dotenv').config();

const {ErrorAPI, SuccesAPI} = require("../../../APIFormat/ApiFormat")
const User = require('../../../models/User');
const ErrorCode = require('../../../APIFormat/ErrorCode');
const driver = require("../../../config/Neo4jConf").driver; // thêm

const LoginRouter = express.Router();



// ====== Đăng ký ======
LoginRouter.post('/sign-up', async (req, res) => {
  try {
    const { name, sex, email, birthday, password } = req.body;
    if (!name || !email || !password) {
      const {status, message} = ErrorCode['MISSING_FIELDS'];
      const APiResponse = ErrorAPI('MISSING_FIELDS');
      return res.status(status).json(APiResponse);
    
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const {status, message} = ErrorCode['EMAIL_EXISTS'];
      const APiResponse = ErrorAPI('EMAIL_EXISTS');
      return res.status(status).json(APiResponse);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname: name,
      sex: sex || 'Nam',
      email,
      birthday,
      password: hashedPassword,
      
    });

    await newUser.save();
    const APiResponse = SuccesAPI('Đăng ký thành công', null);
    res.status(200).json(APiResponse);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});


// ======= Đăng nhập ======
LoginRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const payload = {
      userID: user._id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });

       

    // Gợi ý: đặt cookie httpOnly để trình duyệt tự gửi, và set header Authorization để client JS dễ lấy nếu cần
    try {
      res.cookie("token", token, { httpOnly: true, sameSite: "Lax", secure: process.env.NODE_ENV === "production" });
      res.setHeader("Authorization", `Bearer ${token}`);
    } catch (e) {
      console.warn("Không thể set cookie/header token:", e?.message || e);
    }
    
    // Đặt trạng thái user online trong DB
    try {
      await User.findByIdAndUpdate(user._id, { online: true });
      // gửi thông báo tới bạn bè nếu io có
      try {
        const io = req.app?.get("io");
        if (io) {
          const session = driver.session();
          const friendsResult = await session.run(
            `MATCH (u:User {id: $id})-[:FRIEND_WITH]-(f:User) RETURN f.id AS id`,
            { id: String(user._id) }
          );
          const friendIds = friendsResult.records.map(r => r.get("id"));
          friendIds.forEach(fid => io.to(String(fid)).emit("friendOnline", { userId: String(user._id), online: true }));
          try { await session.close(); } catch {}
        }
      } catch (e) {
        console.warn("Emit friendOnline thất bại:", e?.message || e);
      }
    } catch (e) {
      console.warn("Cập nhật trạng thái online thất bại:", e?.message || e);
    }

    const ApiResponse = SuccesAPI('Đăng nhập thành công', { token, userID: user._id });
    res.status(200).json(ApiResponse);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thêm route logout: lấy user từ token, đặt offline và thông báo bạn bè
LoginRouter.post('/logout', async (req, res) => {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth) return res.status(401).json({ message: "Unauthorized" });
    const parts = String(auth).split(" ");
    if (parts.length !== 2) return res.status(401).json({ message: "Unauthorized" });
    const token = parts[1];
    let payload = null;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      // token không hợp lệ hoặc hết hạn -> vẫn tiếp tục để client xoá token ở phía client
    }
    const userId = payload?.id ?? payload?._id ?? payload?.userId ?? null;
    if (userId) {
      // Hủy bất kỳ timer chuyển offline đang chờ cho user này
      try {
        const io = req.app?.get("io");
        io?.presence?.clearDisconnectTimer && io.presence.clearDisconnectTimer(String(userId));
      } catch (e) { /* ignore */ }
      await User.findByIdAndUpdate(userId, { online: false });
      // Thông báo bạn bè user đã offline
      try {
        const io = req.app?.get("io");
        if (io) {
          const session = driver.session();
          const friendsResult = await session.run(
            `MATCH (u:User {id: $id})-[:FRIEND_WITH]-(f:User) RETURN f.id AS id`,
            { id: String(userId) }
          );
          const friendIds = friendsResult.records.map(r => r.get("id"));
          friendIds.forEach(fid => io.to(String(fid)).emit("friendOffline", { userId: String(userId), online: false }));
          try { await session.close(); } catch {}
        }
      } catch (e) {
        console.warn("Emit friendOffline thất bại:", e?.message || e);
      }
    }
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("Lỗi logout:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = LoginRouter;
