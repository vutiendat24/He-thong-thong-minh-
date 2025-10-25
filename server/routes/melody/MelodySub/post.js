const express = require("express")
const multer = require("multer")
const PostRouter = express.Router()
const { mongoose, connectDB } = require("../../../config/MongooseConf.js")
const cloudinary = require("../../../config/CloudinaryConf.js")
const {initSocket} =  require("../../../socket/index.js")



const User = require("../../../models/User.js")
const Post = require("../../../models/Post.js")
const Like = require("../../../models/Like.js")
const Comment = require("../../../models/Comment.js")
const Notification = require("../../../models/Notification.js")

const { SuccesAPI, ErrorAPI } = require("./../../../APIFormat/ApiFormat.js")
const ErrorCode = require("./../../../APIFormat/ApiFormat.js")

// const 
const verifyToken = require("../../../middleware/auth.js")



// Multer để nhận file từ client
const storage = multer.memoryStorage()
const upload = multer({ storage })


const io = initSocket()


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



const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // seconds
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};


// API tạo bài viết mới
PostRouter.post("/create-post", verifyToken, async (req, res) => {
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
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// API lấy danh sách bài viết
PostRouter.get("/get-posts", verifyToken, async (req, res) => {
  try {
   
    const currentUserId = req.user.userID;
    // 1 Lấy tất cả bài viết, sắp xếp mới nhất lên trước
    const posts = await Post.find().sort({ time: -1 });
    if (!posts || posts.length === 0) {
      return res.status(200).json(SuccesAPI("Không có bài viết nào", []));
    }

    // 2 Lấy tất cả lượt like (để kiểm tra người dùng hiện tại đã like chưa)
    const likes = await Like.find({ userId: currentUserId });

    // 3 Chuyển dữ liệu sang format chuẩn
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

    // 4 Trả kết quả về client
    const ApiRes = SuccesAPI("Lấy danh sách bài viết thành công", formattedPosts);
    res.status(200).json(ApiRes);

  } catch (err) {
    console.error("❌ Lỗi khi lấy bài viết:", err);
    const errorApi = ErrorAPI("CAN_NOT_GET_COMMENT_BY_POSTID")

    res.status(errorApi.status).json(errorApi);
  }
});


// API lay danh sach bai viet cua mot nguoi dung cu the 
PostRouter.get("/get-posts/:userID", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.params.userID;
    console.log("UserID:", currentUserId);
    const posts = await Post.find({ userID: currentUserId }).sort({ time: -1 });

    if (!posts || posts.length === 0) {
      return res.status(200).json(SuccesAPI("Không có bài viết nào", []));
    }

    //  Lấy tất cả lượt like (để kiểm tra người dùng hiện tại đã like chưa)
    const likes = await Like.find({ userId: currentUserId });

    //  Chuyển dữ liệu sang format chuẩn
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

    // Trả kết quả về client
    const ApiRes = SuccesAPI("Lấy danh sách bài viết thành công", formattedPosts);
    res.status(200).json(ApiRes);

  } catch (err) {
    console.error(" Lỗi khi lấy bài viết:", err);
    const errorApi = ErrorAPI("CAN_NOT_GET_COMMENT_BY_POSTID")

    res.status(errorApi.status).json(errorApi);
  }
});

// API lấy chi tiết một bài viết
PostRouter.get("/get-post/:postId", verifyToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
     const likes = await Like.find({ userId: currentUserId });

    // 3 Chuyển dữ liệu sang format chuẩn
    const formattedPost = async (post) => {

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
      };

    const response = SuccesAPI("Lấy bài viết thành công", formattedPost);

    if (!post) {
      return res.status(200).json(response);
    } 
    res.status(200).json(response);
  } catch (err) {
    console.error("❌ Lỗi khi lấy bài viết:", err);
    const errorApi = ErrorAPI("INTERNAL_ERROR")
    res.status(500).json(errorApi);
  }
});

//API đăng comment
PostRouter.post("/:postId/add-comment", verifyToken, async (req, res) => {
  try {
    const { text, parentId } = req.body;
    const userId = req.user.userID; // lấy từ token JWT
    const postId = req.params.postId;

    if (!text) {
      return res.status(400).json({ message: "Thiếu dữ liệu comment" });
    }

    const newComment = new Comment({
      postId,
      userId,
      text,
      parentId: parentId || null,
    });
    await newComment.save();

    //  Cập nhật lại số lượng comment trong Post
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    //  Populate user info để trả về đầy đủ fullname, avatar
    const populatedComment = await newComment.populate("userId", "fullname avatar");

    res.status(201).json({
      message: "Bình luận đã được thêm",
      comment: populatedComment,
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Lỗi khi thêm comment" });
  }
});

//API lấy comment
PostRouter.get('/:postId', async (req, res) => {
  try {
    const postId = req.params.postId
    // Lấy tất cả comment thuộc bài viết đó, bao gồm cả reply
    const allComments = await Comment.find({ postId })
      .populate('userId', 'fullname avatar')
      .sort({ createdAt: 1 })
      .lean()

    // Chia ra comment gốc và reply
    const rootComments = allComments.filter(c => !c.parentId)
    const replies = allComments.filter(c => c.parentId)

    // Hàm dựng cấu trúc lồng nhau
    const buildNestedComments = (comment) => {
      const commentReplies = replies
        .filter(r => String(r.parentId) === String(comment._id))
        .map(r => ({
          id: String(r._id),
          postId: String(r.postId || postId),
          userID: r.userId?._id?.toString() || "",
          fullname: r.userId?.fullname || "",
          avatar: r.userId?.avatar || "",
          text: r.text || "",
          time: r.createdAt,
          likes: typeof r.likes === 'number' ? r.likes : (Array.isArray(r.likes) ? r.likes.length : 0),
          isLiked: !!r.isLiked,
          parentId: r.parentId ? String(r.parentId) : null,
          replies: [] // chỉ 2 cấp (comment -> reply)
        }))

      return {
        id: String(comment._id),
        postId: String(comment.postId || postId),
        userID: comment.userId?._id?.toString() || "",
        fullname: comment.userId?.fullname || "",
        avatar: comment.userId?.avatar || "",
        text: comment.text || "",
        time: comment.createdAt,
        likes: typeof comment.likes === 'number' ? comment.likes : (Array.isArray(comment.likes) ? comment.likes.length : 0),
        isLiked: !!comment.isLiked,
        parentId: null,
        replies: commentReplies
      }
    }

    const structuredComments = rootComments.map(buildNestedComments)
    const apiRes = SuccesAPI("Lấy thành công danh sách bình luận của bài viết", { [postId]: structuredComments })

    res.status(200).json(apiRes)
  } catch (err) {
    console.error('Error fetching comments:', err)
    res.status(500).json({ message: 'Error fetching comments' })
  }
})

//  API Like / Unlike bài viết
PostRouter.post("/:postId/like", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userID; // lấy từ JWT
    const postId = req.params.postId;

    // Kiểm tra post tồn tại không
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    // Kiểm tra đã like chưa
    const existingLike = await Like.findOne({ userId, postId });

    if (existingLike) {
      // Nếu đã like thì bỏ like
      await Like.findByIdAndDelete(existingLike._id);
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });
      return res.json({ message: "Đã bỏ like", isLiked: false });
    } else {
      // Nếu chưa like thì thêm like
      await Like.create({ userId, postId });
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });
      

// {
//       id: '1',
//       type: 'like',
//       senderId: 'user2',
//       senderName: 'Nguyễn Văn A',
//       senderAvatar: 'https://i.pravatar.cc/150?img=1',
//       postId: 'post1',
//       postImage: 'https://picsum.photos/400/400?random=1',
//       message: 'đã thích bài viết của bạn',
//       isRead: false,
//       createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
//     },
      if (post.userID !== userId) {
        const notification = await Notification.create({
          type: 'like',
          senderId: userId,
          receiverId: post.userId,
          postId: postId,
          message: 'đã thích bài viết của bạn',
          isRead: false,
          createdAt: new Date()
        });
        
        // Gửi thông báo real-time qua Socket.IO
        const receiverSocketId = userSockets.get(post.userId);
        if (receiverSocketId) {
          const sender = await User.findById(userId);
          io.to(receiverSocketId).emit('new-notification', {
            ...notification.toObject(),
            senderName: sender.username,
            senderAvatar: sender.avatar
          });
        }
      }
     
      return res.json({ message: "Đã like", isLiked: true });
    }
  } catch (err) {
    console.error(" Lỗi toggle like:", err);
    res.status(500).json({ message: "Lỗi server khi like/unlike bài viết" });
  }
});

//  API đếm lượt like của 1 bài viết
PostRouter.get("/:postId/like-count", async (req, res) => {
  try {
    const postId = req.params.postId;
    const count = await Like.countDocuments({ postId });
    res.json({ postId, likeCount: count });
  } catch (err) {
    console.error("❌ Lỗi khi đếm like:", err);
    res.status(500).json({ message: "Lỗi khi đếm lượt like" });
  }
});

//  API lấy danh sách người đã like bài viết
PostRouter.get("/:postId/likes", async (req, res) => {
  try {
    const postId = req.params.postId;
    const likes = await Like.find({ postId }).populate("userId", "fullname avatar");
    res.json(likes);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách like:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách người đã like" });
  }
});


module.exports = PostRouter
