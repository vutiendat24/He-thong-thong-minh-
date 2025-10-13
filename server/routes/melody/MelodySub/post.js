const express = require("express")
const multer = require("multer")
const PostRouter = express.Router()
const { mongoose, connectDB } = require("../../../config/MongooseConf.js")
const cloudinary =  require("../../../config/CloudinaryConf.js")

const User = require("../../../models/User.js")
const Post = require("../../../models/Post.js")
const Like = require("../../../models/Like.js")

const errorCode = require("../../../APIFormat/ErrorCode.js")
const {ErrorAPI, SuccesAPI } = require ("../../../APIFormat/ApiFormat.js")
const verifyToken = require("../../../middleware/auth.js")
// Multer để nhận file từ client
const storage = multer.memoryStorage()
const upload = multer({ storage })



// API upload ảnh lên Cloudinary
PostRouter.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
        
      return res.status(400).json({ error: "No file uploaded" })
    }
    // Upload buffer lên Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) return res.status(500).json({ error: error.message })
        res.json({ imageUrl: result.secure_url })
      }
    ).end(req.file.buffer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// API lay danh sach bai viet

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // seconds
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

// ✅ API lấy danh sách bài viết
PostRouter.get("/get-posts",verifyToken,  async (req, res) => {
  try {
    // 👉 Giả lập user hiện tại (sau này sẽ lấy từ JWT)
    const currentUserId = "68e625fd737a630e4d6d6656";

    // 1️⃣ Lấy tất cả bài viết, sắp xếp mới nhất lên trước
    const posts = await Post.find().sort({ time: -1 });
    if (!posts || posts.length === 0) {
      return res.status(200).json(SuccesAPI("Không có bài viết nào", []));
    }

    // 2️⃣ Lấy tất cả lượt like (để kiểm tra người dùng hiện tại đã like chưa)
    const likes = await Like.find({userId: currentUserId});

    // 3️⃣ Chuyển dữ liệu sang format chuẩn
    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // Kiểm tra đã like chưa
        const isLiked = likes.some(
          (like) =>
            like.postId.toString() === post._id.toString() &&
            like.userId.toString() === currentUserId
        );

        // Lấy thông tin người đăng bài
        const user = await User.findById(post.userID); // post.userID là string
        const fullname = user ? user.fullname : "Ẩn danh";
        const avatar = user ? user.avatar : "";

        // Format bài viết
        return {
          id: post._id.toString(),
          userId: post.userID || null,
          fullname,
          avatar,
          image: post.image || "",
          caption: post.caption || "",
          likes: post.likeCount || 0,
          commentCount: post.commentCount || 0,
          isLiked,
          time: formatTimeAgo(post.time),
          privacy: post.privacy || "public",
        };
      })
    );

    // 4️⃣ Trả kết quả về client
    const ApiRes = SuccesAPI("Lấy danh sách bài viết thành công", formattedPosts);
    res.status(200).json(ApiRes);

  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});

PostRouter.get("/get-posts/:userId",verifyToken,  async (req, res) => {
  try {
    const { userId } = req.params 

    const user = await User.findById(userId).select("fullname avatar")

    const posts = await Post.find({ userID: userId }).sort({ time: -1 }).lean()
    const formattedPosts = posts.map(post => ({
      ...post,
      fullname: user.fullname,
      avatar: user.avatar,
    }))
    const resAPI = SuccesAPI("Lấy danh sách bài viết thành công", formattedPosts)
    res.status(200).json(resAPI)
  } catch (err) {
    const errorResponse = ErrorAPI("CAN_NOT_GET_POST_LIST")
    res.status(errorResponse.status).json(errorResponse)
  }
})

// API tạo bài viết mới
PostRouter.post("/create-post",verifyToken,  async (req, res) => {
  try {
    const { caption, image, privacy } = req.body
    const userID = req.user.userID; 
    const fullname = "Tien Dat" 
    const newPost = new Post({
      caption,
      image,
      privacy,
      userID,
      fullname,
      time: new Date().toISOString(),
    })
    await newPost.save()
    res.status(201).json({ message: "Post created successfully", post: newPost })
  } catch (err) {
  
    res.status(500).json({ error: err.message })
  }
})


module.exports = PostRouter
