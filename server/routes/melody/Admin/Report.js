const express = require("express")
const ReportRouter = express.Router()



const verifyToken = require("../../../middleware/auth");
const Post = require("../../../models/Post");
const Comment = require("../../../models/Comment");
const Report = require("../../../models/Report");
const DailyStats = require("../../../models/DailyStats")

const User = require("../../../models/User")


const getDailyId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Đảm bảo 2 chữ số
  const day = String(now.getDate()).padStart(2, '0');
  return `daily_${year}_${month}_${day}`;
};

ReportRouter.post("/report", verifyToken, async (req, res) => {
  try {
    const { targetId, targetType, reasons } = req.body;
    const reporterId = req.user.userID;

    if (!targetId || !targetType || !reasons) {
      return res.status(400).json({ message: "Thiếu thông tin báo cáo." });
    }

    const TargetModel = targetType === 'post' ? Post : Comment;

    const targetExists = await TargetModel.findById(targetId);
    if (!targetExists) {
      return res.status(404).json({
        message: `Không tìm thấy ${targetType} với ID này.`
      });
    }
    // Thêm đoạn này sau khi kiểm tra targetExists
const existingReport = await Report.findOne({ 
    targetType, 
    targetId, 
    reporterId 
});

if (existingReport) {
    return res.status(200).json({ 
        message: "Bạn đã báo cáo nội dung này trước đó rồi." 
    });
}
    const mainReason = Array.isArray(reasons) ? reasons[0] : reasons;

    const newReport = new Report({
      targetType,
      targetId,
      reporterId,
      reason: mainReason
    });
    await newReport.save();

    await TargetModel.findByIdAndUpdate(targetId, {
      $inc: { reportCount: 1 },
      $addToSet: { reasons: { $each: Array.isArray(reasons) ? reasons : [reasons] } }
    });

    const todayId = getDailyId();

    let reasonKey = "other";
    const validReasons = ["hate_speech", "spam", "nudity", "violence", "fake_news"];
    if (validReasons.includes(mainReason)) {
      reasonKey = mainReason;
    }

    await DailyStats.findByIdAndUpdate(
      todayId,
      {
        $inc: {
          reportsToday: 1,                      
          [`reportByReason.${reasonKey}`]: 1    
        },
        $setOnInsert: { createdAt: new Date() } 
      },
      { upsert: true, new: true } 
    );
    return res.status(200).json({ message: "Báo cáo thành công." });
  } catch (error) {
    res.status(500).json(error.message)

  }
})


const generateItemId = (index) => `ci_${String(index).padStart(3, '0')}`;

const getLatestReportDate = () => {
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 48)); 
    return date;
};

ReportRouter.get("/content-reported", async (req, res) => {
    try {
        const posts = await Post.find({ reportCount: { $gt: 0 } })
            .lean()
            .sort({ reportCount: -1 });

        const comments = await Comment.find({ reportCount: { $gt: 0 } })
            .populate('userID', 'fullname avatar') 
            .lean()
            .sort({ reportCount: -1 });

        const postUserIds = posts.map(p => p.userID);
        const postAuthors = await User.find({ _id: { $in: postUserIds } }).lean();
        
        const authorMap = {};
        postAuthors.forEach(u => {
            authorMap[u._id.toString()] = u.fullname;
        });

        const formattedPosts = posts.map((post, index) => {
            return {
                _id: `ci_post_${post._id}`, 
                type: "post",
                content: {
                    _id: post._id,
                    authorName: authorMap[post.userID] || "Unknown User",
                    userID: post.userID,
                    image: post.image || "",
                    caption: post.caption,
                    likeCount: post.likeCount,
                    commentCount: post.commentCount,
                    post_type: post.image ? "image" : "text", 
                    status: "active", 
                    reportCount: post.reportCount,
                    engagement_score: post.likeCount + post.commentCount, 
                    createdAt: post.created_at 
                },
                reportCount: post.reportCount,
                reasons: post.reasons || [],
                latestReportDate: getLatestReportDate()
            };
        });

        const formattedComments = comments.map((comment, index) => {
            return {
                _id: `ci_cmt_${comment._id}`,
                type: "comment",
                content: {
                    _id: comment._id,
                    authorName: comment.userID ? comment.userID.fullname : "Unknown", 
                    userID: comment.userID ? comment.userID._id : null,
                    text: comment.text,
                    status: "active",
                    reportCount: comment.reportCount,
                    createdAt: comment.createdAt
                },
                reportCount: comment.reportCount,
                reasons: comment.reasons || [],
                latestReportDate: getLatestReportDate()
            };
        });
        const combinedData = [...formattedPosts, ...formattedComments].sort((a, b) => {
            return b.reportCount - a.reportCount;
        });

        return res.status(200).json(combinedData);

    } catch (error) {
        console.error("Error fetching reported content:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})
module.exports = ReportRouter
