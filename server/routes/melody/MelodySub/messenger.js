const express = require("express");
const Message = require("../../../models/Message");
const User = require("../../../models/User");
const Conversation = require("../../../models/Conversation");
const driver = require("../../../config/Neo4jConf").driver;
const mongoose = require("mongoose");

const MessageRouter = express.Router();

// --- Helper: lấy userId từ Authorization Bearer token (không xác thực chữ ký ở đây; khuyến nghị dùng jwt.verify trong production) ---
function getUserIdFromAuthHeader(req) {
	try {
		const auth = req.headers?.authorization || req.headers?.Authorization;
		if (!auth) return null;
		const parts = String(auth).split(" ");
		if (parts.length !== 2) return null;
		const token = parts[1];
		const payload = token.split(".")[1];
		if (!payload) return null;
		const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const json = Buffer.from(b64, "base64").toString("utf8");
		const obj = JSON.parse(json);
		return obj?.id ?? obj?._id ?? obj?.userId ?? obj?.userID ?? null;
	} catch (e) {
		return null;
	}
}

// --- Lấy danh sách conversations của user hiện tại (lấy user từ token) ---
MessageRouter.get("/conversations", async (req, res) => {
	try {
		const userId = getUserIdFromAuthHeader(req);
		// const userId = "68e68f7d66b17e22175b8a23"
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const conversations = await Conversation.find({ participants: userId })
			.populate("participants", "_id fullname email avatar online")
			.sort({ updatedAt: -1 });
		return res.status(200).json({ success: true, count: conversations.length, data: conversations });
	} catch (err) {
		console.error("❌ Lỗi lấy hội thoại:", err);
		res.status(500).json({ error: "Lỗi server", details: err.message });
	}
});

// --- Tạo conversation giữa user hiện tại (từ token) và otherId (param) ---
MessageRouter.post("/conversation/:otherId", async (req, res) => {
	const userId1 = getUserIdFromAuthHeader(req);
	const session = driver.session();
	const userId2 = req.params.otherId;
	if (!userId1) return res.status(401).json({ message: "Unauthorized" });

	try {
		if (!mongoose.Types.ObjectId.isValid(userId2)) {
			return res.status(400).json({ message: "ID người dùng không hợp lệ" });
		}

		const checkFriendship = await session.run(
			`
      MATCH (u1:User {id: $userId1})-[r:FRIEND_WITH]-(u2:User {id: $userId2})
      RETURN COUNT(r) AS count
      `,
			{ userId1, userId2 }
		);
		const countRecord = checkFriendship.records[0]?.get("count");
		const isFriend = countRecord ? countRecord.toNumber() > 0 : false;

		// tìm hoặc tạo conversation (tạo ObjectId bằng new)
		const p1 = new mongoose.Types.ObjectId(String(userId1));
		const p2 = new mongoose.Types.ObjectId(String(userId2));
		let conversation = await Conversation.findOne({ participants: { $all: [p1, p2] } });
		if (!conversation) {
			conversation = new Conversation({ participants: [p1, p2] });
			await conversation.save();
		}

		// nếu chưa là bạn, tạo quan hệ Neo4j (giữ hành vi trước đó)
		if (!isFriend) {
			await session.run(
				`
        MERGE (u1:User {id: $userId1})
        MERGE (u2:User {id: $userId2})
        MERGE (u1)-[:FRIEND_WITH]->(u2)
        MERGE (u2)-[:FRIEND_WITH]->(u1)
        `,
				{ userId1, userId2 }
			);
		}

		return res.status(200).json({ success: true, data: conversation });
	} catch (err) {
		console.error("❌ Lỗi khi tạo bạn bè + hội thoại:", err);
		res.status(500).json({ error: "Lỗi server", details: err.message });
	} finally {
		try { await session.close(); } catch {}
	}
});

// --- Gửi tin nhắn: server lấy sender từ token ---
MessageRouter.post("/message", async (req, res) => {
	try {
		const { conversationId, content } = req.body;
		const senderId = getUserIdFromAuthHeader(req);
		// const senderId = "68e68f7d66b17e22175b8a23";
		if (!senderId) return res.status(401).json({ message: "Unauthorized" });
		if (!conversationId || !content) return res.status(400).json({ message: "Thiếu dữ liệu tin nhắn" });

		const message = new Message({ conversationId, senderId, content, createdAt: new Date() });
		await message.save();

		await Conversation.findByIdAndUpdate(conversationId, {
			lastMessage: content,
			lastSender: senderId,
			updatedAt: new Date(),
		});

		// emit realtime nếu io có trên app
		try {
			const io = req.app?.get("io");
			if (io) {
				const conv = await Conversation.findById(conversationId).lean();
				const participants = (conv?.participants ?? []).map(String);
				const populated = await Message.findById(message._id)
					.populate({ path: "senderId", select: "_id fullname email avatar" })
					.lean();
				participants.forEach((pid) => {
					io.to(String(pid)).emit("receiveMessage", populated || message);
				});
			}
		} catch (e) {
			console.warn("Không thể emit receiveMessage từ /message:", e?.message || e);
		}

		return res.status(201).json({ success: true, data: message });
	} catch (err) {
		console.error("❌ Lỗi khi gửi tin nhắn:", err);
		res.status(500).json({ error: "Lỗi server", details: err.message });
	}
});

// --- Lấy danh sách conversation cho userId (cũ) vẫn giữ để tương thích ---
MessageRouter.get("/conversations/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const conversations = await Conversation.find({ participants: userId })
			.populate("participants", "_id fullname email avatar")
			.sort({ updatedAt: -1 });
		if (!conversations.length) return res.status(200).json({ success: true, message: "Không có cuộc hội thoại nào.", data: [] });
		res.status(200).json({ success: true, count: conversations.length, data: conversations });
	} catch (err) {
		console.error("❌ Lỗi lấy hội thoại:", err);
		res.status(500).json({ error: "Lỗi server", details: err.message });
	}
});

// --- Lấy tất cả tin nhắn trong cuộc hội thoại ---
MessageRouter.get("/messages/:conversationId", async (req, res) => {
	try {
		const { conversationId } = req.params;
		if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({ message: "conversationId không hợp lệ" });
		}
		const messages = await Message.find({ conversationId })
			.sort({ createdAt: 1 })
			.populate({ path: "senderId", model: "User", select: "_id email fullname avatar online" })
			.populate({ path: "receiverId", model: "User", select: "_id email fullname avatar online" });
		res.status(200).json(messages);
	} catch (error) {
		console.error("❌ Lỗi khi lấy tin nhắn:", error);
		res.status(500).json({ message: "Lỗi server" });
	}
});

module.exports = MessageRouter;
