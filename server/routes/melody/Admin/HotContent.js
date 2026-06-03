const express = require("express")
const HotContentRouter = express.Router()


const Post = require("../../../models/Post");
const User =require("../../../models/User");

const aggregateReportReasons = (reasonsArray) => {
    if (!reasonsArray || reasonsArray.length === 0) return [];
    
    const counts = {};
    reasonsArray.forEach(r => {
        counts[r] = (counts[r] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
        reason: key,
        count: counts[key]
    }));
};


HotContentRouter.get("/hot-content",async (req, res) => {
    try {
        // 1. Lấy 10 bài post có likeCount cao nhất
        const posts = await Post.find()
            .sort({ likeCount: -1 }) // Sắp xếp giảm dần theo like
            .limit(10)               // Giới hạn 10 bài
            .lean();

        // 2. Lấy thông tin Author (vì Post lưu userID là String, không populate được trực tiếp nếu không phải ObjectId)
        const userIds = posts.map(p => p.userID);
        const authors = await User.find({ _id: { $in: userIds } }).lean();
        
        // Tạo Map để tra cứu tên nhanh: { "user_001": "Messi", ... }
        const authorMap = {};
        authors.forEach(user => {
            // Ưu tiên lấy fullname, nếu không có thì lấy username
            authorMap[user._id.toString()] = user.fullname || user.username || "Unknown User";
        });

        // 3. Transform dữ liệu theo đúng mẫu HotContentItem
        const hotContentItems = posts.map((post, index) => {
            // Tính điểm tương tác (ví dụ: like + comment)
            const engagementScore = (post.likeCount || 0) + (post.commentCount || 0);
            
            // Xử lý list report
            const formattedReports = aggregateReportReasons(post.reasons);

            return {
                _id: `hot_${String(index + 1).padStart(3, '0')}`, // Tạo ID giả: hot_001, hot_002...
                post: {
                    _id: post._id,
                    authorName: authorMap[post.userID] || "Unknown User",
                    userID: post.userID,
                    image: post.image || "",
                    caption: post.caption || "",
                    likeCount: post.likeCount || 0,
                    commentCount: post.commentCount || 0,
                    post_type: post.image ? "image" : "text", // Logic: có ảnh là image, không là text
                    status: "active", // Giả định status
                    reportCount: post.reportCount || 0,
                    engagement_score: engagementScore,
                    createdAt: post.created_at // Lưu ý: Schema bạn gửi là created_at
                },
                engagement_score: engagementScore,
                reportCount: post.reportCount || 0,
                isReported: (post.reportCount || 0) > 0,
                reports: formattedReports
            };
        });

        return res.status(200).json(hotContentItems);

    } catch (error) {
        console.error("Error fetching top liked posts:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports =HotContentRouter