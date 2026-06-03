const express = require("express")
const multer = require("multer")
const PostRouter = express.Router()
const { mongoose, connectDB } = require("../../../config/MongooseConf.js")
const cloudinary = require("../../../config/CloudinaryConf.js")
const { onlineUsers } = require("../../../socket/index.js")

const axios = require("axios")

const User = require("../../../models/User.js")
const Post = require("../../../models/Post.js")
const Like = require("../../../models/Like.js")
const Comment = require("../../../models/Comment.js")
const Notification = require("../../../models/Notification.js")
const DailyStats = require("../../../models/DailyStats.js")

const { SuccesAPI, ErrorAPI } = require("./../../../APIFormat/ApiFormat.js")
const ErrorCode = require("./../../../APIFormat/ApiFormat.js")

// const 
const verifyToken = require("../../../middleware/auth.js")



// Multer để nhận file từ client
const storage = multer.memoryStorage()
const upload = multer({ storage })

async function checkToxicAndUpdate(commentId, text) {
  const response = await axios.post(
    "http://localhost:8000/api/comment-toxic-predict",
    {
      text,
      threshold: 0.8
    }
  );

  const { toxic_labels, scores } = response.data;

  const isToxic = toxic_labels.length > 0;

  await Comment.findByIdAndUpdate(commentId, {
    isVisible: !isToxic,
    reasons: toxic_labels[0],
    reportCount: toxic_labels.length
  });

  return {
    isToxic,
    toxic_labels,
    scores
  };
}


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

const getDailyId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Đảm bảo 2 chữ số
  const day = String(now.getDate()).padStart(2, '0');
  return `daily_${year}_${month}_${day}`;
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
      created_at: new Date().toISOString(),
      engagement_score: 0
    })
    await newPost.save()
    const todayId = getDailyId();

    await DailyStats.findByIdAndUpdate(
      todayId,
      {
        $inc: {
          totalPosts: 1,

        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, new: true }
    );
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
    // 1 lay danh sach bai viet tu he thong de xuat
    const suggestRes = await axios.post("http://localhost:8000/api/v1/feed",
      {
        "user_id": `${currentUserId}`,
        "limit": 50,
        "offset": 0,
        "exclude_post_ids": []
      })
    const postsSuggest = suggestRes.data.posts || []
    const postIDs = postsSuggest.map(post => post.post_id)
    const posts = await Post.find({ _id: { $in: postIDs } });
    if (!posts || posts.length === 0) {
      return res.status(200).json(SuccesAPI("Không có bài viết nào", []));
    }

    const likes = await Like.find({ userID: currentUserId });

    const sortedPosts = [...posts].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const latestPosts = sortedPosts.slice(0, 3);

    const remainingPosts = sortedPosts.slice(3);

    for (let i = remainingPosts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingPosts[i], remainingPosts[j]] = [
        remainingPosts[j],
        remainingPosts[i],
      ];
    }

    const mixedPosts = [...latestPosts, ...remainingPosts];
    // 3 Chuyển dữ liệu sang format chuẩn
    const formattedPosts = await Promise.all(
      mixedPosts.map(async (post) => {
        // Kiểm tra đã like chưa
        const isLiked = likes.some(
          (like) =>
            like.postId.toString() === post._id.toString() &&
            like.userID.toString() === currentUserId
        );

        // Lấy thông tin người đăng bài
        const user = await User.findById(post.userID); // post.userID là string
        const fullname = user ? user.fullname : "Ẩn danh";
        const avatar = user ? user.avatar : "";

        // Format bài viết
        return {
          id: post._id.toString(),
          userID: post.userID || null,
          fullname,
          avatar,
          image: post.image || "",
          caption: post.caption || "",
          likes: post.likeCount || 0,
          commentCount: post.commentCount || 0,
          isLiked,
          created_at: formatTimeAgo(post.created_at),
          privacy: post.privacy || "public",
        };
      })
    );

    // 4 Trả kết quả về client
    const ApiRes = SuccesAPI("Lấy danh sách bài viết thành công", formattedPosts);
    res.status(200).json(ApiRes);

  } catch (err) {

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
    const likes = await Like.find({ userID: currentUserId });

    //  Chuyển dữ liệu sang format chuẩn
    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // Kiểm tra đã like chưa
        const isLiked = likes.some(
          (like) =>
            like.postId.toString() === post._id.toString() &&
            like.userID.toString() === currentUserId
        );

        // Lấy thông tin người đăng bài
        const user = await User.findById(post.userID); // post.userID là string
        const fullname = user ? user.fullname : "Ẩn danh";
        const avatar = user ? user.avatar : "";

        // Format bài viết
        return {
          id: post._id.toString(),
          userID: post.userID || null,
          fullname,
          avatar,
          image: post.image || "",
          caption: post.caption || "",
          likes: post.likeCount || 0,
          commentCount: post.commentCount || 0,
          isLiked,
          created_at: formatTimeAgo(post.created_at),
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
    const currentUserId = req.user.userID
    const post = await Post.findById(postId);
    const likes = await Like.find({ userID: currentUserId });

    // 3 Chuyển dữ liệu sang format chuẩn
    const formattedPost = async (post) => {

      // Kiểm tra đã like chưa
      const isLiked = likes.some(
        (like) =>
          like.postId.toString() === post._id.toString() &&
          like.userID.toString() === currentUserId
      );

      // Lấy thông tin người đăng bài
      const user = await User.findById(post.userID); // post.userID là string
      const fullname = user ? user.fullname : "Ẩn danh";
      const avatar = user ? user.avatar : "";

      // Format bài viết
      return {
        id: post._id.toString(),
        userID: post.userID || null,
        fullname,
        avatar,
        image: post.image || "",
        caption: post.caption || "",
        likes: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        isLiked,
        created_at: formatTimeAgo(post.created_at),
        privacy: post.privacy || "public",
      };
    };
    const postData = await formattedPost(post);
    const response = SuccesAPI("Lấy bài viết thành công ", postData);

    if (!post) {
      return res.status(204).json(response);
    }
    res.status(200).json(response);
  } catch (err) {
    const errorApi = ErrorAPI(`error when get detail post, detail error ${err.message}`, "INTERNAL_ERROR")
    res.status(500).json(errorApi);
  }
});

//API đăng comment
PostRouter.post("/:postId/add-comment", verifyToken, async (req, res) => {
  try {
    const { text, parentId } = req.body;
    const userID = req.user.userID;
    const postId = req.params.postId;

    if (!text) {
      return res.status(400).json({ message: "Thiếu dữ liệu comment" });
    }
    const newComment = await Comment.create({
      postId,
      userID,
      text,
      parentId: parentId || null,
    });
    await checkToxicAndUpdate(newComment._id, text)

    //  Cập nhật lại số lượng comment trong Post
    const post = await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populatedComment = await newComment.populate("userID", "fullname avatar");

    let messageNotification;
    text.length > 10 ?
      messageNotification = `đã bình luận bài viết của bạn: ${text.slice(0, 10)} ...`
      :
      messageNotification = `đã bình luận bài viết của bạn: ${text.slice(0, 10)} `

    if (post.userID !== userID) {
      const notification = await Notification.create({
        type: 'comment',
        senderId: userID,
        receiverId: post.userID,
        postId: postId,
        message: messageNotification,
        isRead: false,
        createdAt: new Date()
      });

      // Gửi thông báo đến chủ nhân bài viết 

      const receiverSocketId = onlineUsers.get(post.userID);
      if (receiverSocketId) {
        const sender = await User.findById(userID);

        req.app.get('io').to(receiverSocketId).emit('new-notification', {
          id: notification._id,
          ...notification.toObject(),
          senderName: sender.fullname,
          senderAvatar: sender.avatar,
          postImage: post?.image || null,
          commentId: newComment._id,
        });

      }
    }
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
    const allComments = await Comment.find({ postId, isVisible: true })
      .populate('userID', 'fullname avatar')
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
          userID: r.userID?._id?.toString() || "",
          fullname: r.userID?.fullname || "",
          avatar: r.userID?.avatar || "",
          text: r.text || "",
          created_at: r.createdAt,
          likes: typeof r.likes === 'number' ? r.likes : (Array.isArray(r.likes) ? r.likes.length : 0),
          isLiked: !!r.isLiked,
          parentId: r.parentId ? String(r.parentId) : null,
          isVisible: r.isVisible || null,
          replies: [] // chỉ 2 cấp (comment -> reply)
        }))

      return {
        id: String(comment._id),
        postId: String(comment.postId || postId),
        userID: comment.userID?._id?.toString() || "",
        fullname: comment.userID?.fullname || "",
        avatar: comment.userID?.avatar || "",
        text: comment.text || "",
        created_at: comment.createdAt,
        likes: typeof comment.likes === 'number' ? comment.likes : (Array.isArray(comment.likes) ? comment.likes.length : 0),
        isLiked: !!comment.isLiked,
        parentId: null,
        replies: commentReplies,
        isVisible: comment.isVisible || null,
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
    const userID = req.user.userID; // lấy từ JWT
    const postId = req.params.postId;

    // Kiểm tra post tồn tại không
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    // Kiểm tra đã like chưa
    const existingLike = await Like.findOne({ userID, postId });

    if (existingLike) {
      // Nếu đã like thì bỏ like
      await Like.findByIdAndDelete(existingLike._id);
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });
      return res.json({ message: "Đã bỏ like", isLiked: false });
    } else {
      // Nếu chưa like thì thêm like
      await Like.create({ userID, postId });
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });



      if (post.userID !== userID) {
        const notification = await Notification.create({
          type: 'like',
          senderId: userID,
          receiverId: post.userID,
          postId: postId,
          message: 'đã thích bài viết của bạn',
          isRead: false,
          createdAt: new Date()
        });

        // Gửi thông báo đến chủ nhân bài viết 

        const receiverSocketId = onlineUsers.get(post.userID);
        if (receiverSocketId) {
          const sender = await User.findById(userID);

          req.app.get('io').to(receiverSocketId).emit('new-notification', {
            id: notification._id,
            ...notification.toObject(),
            senderName: sender.fullname,
            senderAvatar: sender.avatar,
            postImage: post?.image || null,
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
    const likes = await Like.find({ postId }).populate("userID", "fullname avatar");
    res.json(likes);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách like:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách người đã like" });
  }
});


module.exports = PostRouter