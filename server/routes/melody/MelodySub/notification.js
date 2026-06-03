const express = require("express");
const verifyToken = require("../../../middleware/auth");
const notifyRouter = express.Router()

const Notification = require("../../../models/Notification.js")
const User = require("../../../models/User.js")
const Post = require("../../../models/Post.js");
const { SuccesAPI, ErrorAPI } = require("../../../APIFormat/ApiFormat.js");
const ErrorCode = require("../../../APIFormat/ErrorCode.js");

notifyRouter.get("/getNotifications", verifyToken, async(req,res) => {
  const userID = req.user.userID

  const notifications = await Notification.find({ receiverId: userID })
    .sort({ createdAt: -1 })
    .lean();

  const result = await Promise.all(
    notifications.map(async (noti) => {
      // Lấy thông tin người gửi
      const sender = await User.findById(noti.senderId)
        .select("_id fullname avatar")
        .lean();

      // Lấy thông tin bài viết
      const post = noti.postId
        ? await Post.findById(noti.postId).select("_id image").lean()
        : null;

      // Tạo message theo type
      let message = "";
      if (noti.type === "like") message = "đã thích bài viết của bạn";
      if (noti.type === "comment") message = "đã bình luận bài viết của bạn";
      if (noti.type === "follow") message = "đã theo dõi bạn";

      return {
        id: noti._id,
        type: noti.type,
        senderId: noti.senderId,
        senderName: sender?.fullname || "",
        senderAvatar: sender?.avatar || "",
        postId: noti.postId || null,
        postImage: post?.image || null,
        message,
        isRead: noti.isRead,
        createdAt: noti.createdAt,
      };
    })
  );

  res.json({
    success: true,
    data: result,
  });
})

notifyRouter.post("/read-notification/:notificationId", verifyToken, async(req, res)=>{
try {
  const notificationId = req.params.notificationId
  const isSucces = await Notification.findByIdAndUpdate(notificationId, {isRead: true})
  if (isSucces){
    const apiRes = SuccesAPI("Đã đọc thông báo",null)
    res.status(200).json(apiRes)
  }
  res.status(404).json(SuccesAPI("Khong tim thay thong bao ",null))
} catch (error) {
  const errRes = ErrorAPI(`Lỗi khi cập nhật trạng thái đã đọc của thông báo, lỗi: ${error.message}`, ErrorCode.INTERNAL_ERROR)
  res.status(500).json(errRes)
}
})





module.exports = notifyRouter
