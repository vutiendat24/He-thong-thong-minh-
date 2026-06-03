

const express = require("express")
const verifyToken = require("../../../middleware/auth.js");
const User = require("../../../models/User");
const Notification = require("../../../models/Notification.js");
const { SuccesAPI, ErrorAPI } = require("../../../APIFormat/ApiFormat.js");
const ErrorCode = require("./../../../APIFormat/ErrorCode.js")
const { driver } = require("../../../config/Neo4jConf.js")
const { onlineUsers } = require("../../../socket/index.js")

const neo4j = require("neo4j-driver");
const ProfileRouter = express.Router()
// #  Đặt ở đầu file profile.js, ngay sau các lệnh require khác
const mongoose = require('mongoose')

const Conversation = require("../../../models/Conversation.js")

ProfileRouter.get("/get-profile/:userID", verifyToken, async (req, res) => {
  try {
    const friendID = req.params.userID;
    const userID = req.user.userID
    let profileData = await User.findById(friendID).select(" fullname avatar totalPost totalFollowing totalFollower").lean();
    if (!profileData) {
      const errorResponse = ErrorAPI("USER_NOT_FOUND")
      return res.status(errorResponse.status).json(errorResponse);
    }
    let isFollowing = false
    if (userID === friendID) {
      isFollowing = false
    } else {
      const session = driver.session();

      const result = await session.run(
        `MATCH (u1:User {id: $u1})
      MATCH (u2:User {id: $u2})
      OPTIONAL MATCH (u1)-[r:FRIEND]-(u2)
      RETURN r`,
        { u1: friendID, u2: userID }
      );
      await session.close();
      isFollowing = result.records[0].get("r") !== null;
    }
    profileData = { ...profileData, isFollowing: isFollowing, id: profileData._id }

    const apiRes = SuccesAPI("Lấy thông tin người dùng thành công", profileData);
    res.status(200).json(apiRes);
  } catch (error) {
    const errRes = ErrorAPI(`Lỗi khi lấy trang cá nhan, loi: ${error.message}`, ErrorCode.GET_PROFILE_ERROR)
    res.status(errRes.status).json(errRes)
  }
})

ProfileRouter.post("/update-avatar/:userID", verifyToken, async (req, res) => {
  const userID = req.user.userID;
  const { avatar } = req.body;

  try {
    const updatedProfile = await User.findByIdAndUpdate(
      userID,
      { $set: { avatar } },
      { new: true }
    ).select("fullname avatar totalPost totalFollowing totalFollower");

    const apiRes = SuccesAPI("Cập nhật thông tin người dùng thành công", updatedProfile);
    res.status(200).json(apiRes);
  } catch (error) {
    console.error("Error updating avatar:", error);
    const apiRes = ErrorAPI("UPDATE_PROFILE_ERROR");
    res.status(500).json(apiRes);
  }

})

ProfileRouter.post("/follow/:userID", verifyToken, async (req, res) => {

  try {
    const userID = req.user.userID;
    const friendID = req.params.userID
    // tang so luong following  cua ban than 
    const sender = await User.findByIdAndUpdate(
      userID,
      { $inc: { totalFollowing: 1 } }
    );
    // tăng số lượng follow cua nguoi duoc follow
    await User.findByIdAndUpdate(
      friendID,
      { $inc: { totalFollower: 1 } }
    );

    let session = driver.session();
    await session.run(
      `MATCH (u1:User {id: $u1})
      MATCH (u2:User {id: $u2})
      MERGE (u1)-[:FRIEND]-(u2)`,
      { u1: userID, u2: friendID }
    );
    await session.close();
    const notification = await Notification.create({
      type: 'follow',
      senderId: userID,
      receiverId: friendID,
      message: "đã theo dõi bạn",
      isRead: false,
      createdAt: new Date()
    });
    // Gửi thông báo đến người được follow    
    const receiverSocketId = onlineUsers.get(friendID);
    console.log(onlineUsers)
    if (receiverSocketId) {
      req.app.get('io').to(receiverSocketId).emit('new-notification', {
        id: notification._id,
        ...notification.toObject(),
        senderName: sender.fullname,
        senderAvatar: sender.avatar,
        postImage: null,
      });
    }


    session = driver.session();
    if (!userID) return res.status(401).json({ message: "Unauthorized" });

    try {
      if (!mongoose.Types.ObjectId.isValid(friendID)) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }

      const checkFriendship = await session.run(
        `
      MATCH (u1:User {id: $userID})-[r:FRIEND_WITH]-(u2:User {id: $friendID})
      RETURN COUNT(r) AS count
      `,
        { userID, friendID }
      );
      const countRecord = checkFriendship.records[0]?.get("count");
      const isFriend = countRecord ? countRecord.toNumber() > 0 : false;

      // tìm hoặc tạo conversation (tạo ObjectId bằng new)
      const p1 = new mongoose.Types.ObjectId(String(userID));
      const p2 = new mongoose.Types.ObjectId(String(friendID));
      let conversation = await Conversation.findOne({ participants: { $all: [p1, p2] } });
      if (!conversation) {
        conversation = new Conversation({ participants: [p1, p2] });
        await conversation.save();
      }
    } catch (err) {
      console.error("❌ Lỗi khi tạo bạn bè + hội thoại:", err);
      res.status(500).json({ error: "Lỗi server", details: err.message });
    } finally {
      try { await session.close(); } catch { }
    }
    const apiRes = SuccesAPI("da follow", null)
    res.status(200).json(apiRes)
  } catch (error) {
    console.log(error)
    const errorRes = ErrorAPI(error.message, ErrorCode.FOLLOW_ERROR)
    res.status(500).json(errorRes)
  }
})

ProfileRouter.post("/unfollow/:userID", verifyToken, async (req, res) => {

  try {
    const userID = req.user.userID;
    const friendID = req.params.userID

    const session = driver.session();

    await session.run(
      `MATCH (u1:User {id: $u1})
      MATCH (u2:User {id: $u2})
      MATCH (u1)-[r:FRIEND]-(u2)
      DELETE r`,
      { u1: userID, u2: friendID }
    );
    await session.close();
    await User.findByIdAndUpdate(
      userID,
      { $inc: { totalFollowing: -1 } }
    );
    // tăng số lượng follow cua nguoi duoc follow
    const friend = await User.findByIdAndUpdate(
      friendID,
      { $inc: { totalFollower: -1 } }
    );
    const apiRes = SuccesAPI("da unfollow")
    res.status(200).json(apiRes)
  } catch (error) {
    const errorRes = ErrorAPI(error.message, ErrorCode.UN_FOLLOW_ERROR)
    res.status(500).json(errorRes)
  }
})
ProfileRouter.get("/suggest-friend", verifyToken, async (req, res) => {
  const currentUserId = req.user.userID;
  const LIMIT_RECOMMENDATION = 5;
  let session = null;

  try {
    session = driver.session();

    let recommendations = [];

    // === 1. Ưu tiên 1: Bạn chung (Mutual Friends) ===
    const mutualQuery = `
      MATCH (me:User {id: $currentUserId})
      MATCH (me)-[:FRIEND]-(friend)-[:FRIEND]-(suggestion)
      WHERE NOT (me)-[:FRIEND]-(suggestion) 
        AND suggestion.id <> me.id
      WITH suggestion, COUNT(DISTINCT friend) AS mutualCount
      ORDER BY mutualCount DESC, suggestion.fullname ASC
      LIMIT 10
      RETURN 
        suggestion.id AS id,
        suggestion.fullname AS fullname,
        suggestion.avatar AS avatar,
        mutualCount AS mutualFriendsCount,
        'Mutual Friends' AS reason
    `;

    const mutualResult = await session.run(mutualQuery, { currentUserId });

    recommendations = mutualResult.records.map(r => ({
      id: r.get('id'),
      fullname: r.get('fullname') || 'Người dùng',
      avatar: r.get('avatar') || null,
      mutualFriends: Number(r.get('mutualFriendsCount')), // ép về số nguyên
      reason: r.get('reason'),
      isFollowing: false,
    }));

    // Nếu đã đủ 5 → trả luôn
    if (recommendations.length >= LIMIT_RECOMMENDATION) {
      await session.close();
      return res.json(recommendations.slice(0, LIMIT_RECOMMENDATION));
    }

    // === 2. Ưu tiên 2: Người dùng phổ biến (Popular Users) ===
    const existingIds = recommendations.map(r => r.id);
    const remaining = LIMIT_RECOMMENDATION - recommendations.length;

    const limitInt = remaining > 0 ? remaining : 1;

    const popularQuery = `
      MATCH (suggestion:User)
      WHERE suggestion.id <> $currentUserId
        AND NOT suggestion.id IN $existingIds
        AND NOT (suggestion)<-[:FRIEND]-(:User {id: $currentUserId})
        AND NOT (suggestion)-[:FRIEND]->(:User {id: $currentUserId})
      WITH suggestion
      ORDER BY suggestion.totalFollower DESC, suggestion.fullname ASC
      LIMIT $limit
      RETURN 
        suggestion.id AS id,
        suggestion.fullname AS fullname,
        suggestion.avatar AS avatar,
        suggestion.totalFollower AS totalFollower,
        'Popular User' AS reason
    `;

    const popularResult = await session.run(popularQuery, {
      currentUserId,
      existingIds,
      limit: neo4j.int(limitInt)
    });

    const popularRecs = popularResult.records.map(r => ({
      id: r.get('id'),
      fullname: r.get('fullname') || 'Người dùng',
      avatar: r.get('avatar') || null,
      totalFollower: r.get('totalFollower') ? Number(r.get('totalFollower')) : 0,
      reason: r.get('reason'),
      isFollowing: false,
    }));

    recommendations = [...recommendations, ...popularRecs];
    const apiRes = SuccesAPI("Lấy danh sách đề xuất bạn bè thành công", recommendations.slice(0, LIMIT_RECOMMENDATION))
    await session.close();
    return res.json(apiRes);

  } catch (error) {
    if (session) await session.close();
    const errRes = ErrorAPI(`Lỗi khi lấy danh sách đề xuẩt bạn bè, lỗi: ${error.message} `, ErrorCode.SUGGEST_FRIEND_ERROR)
    return res.status(500).json(errRes);
  }
});

module.exports = ProfileRouter

