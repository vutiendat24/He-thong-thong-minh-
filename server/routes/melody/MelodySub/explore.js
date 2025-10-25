// routes/explore.js
const express = require("express");
const verifyToken = require("../../../middleware/auth");
const Post = require("../../../models/Post");
const User = require("../../../models/User");
const Like = require("../../../models/Like");
const { SuccesAPI, ErrorAPI } = require("../../../APIFormat/ApiFormat");

const ExploreRouter = express.Router();


ExploreRouter.get("/get-explore",verifyToken, async (req, res) =>{
  const explorePostList = await Post.find({privacy : "public"}).sort({createdAt: -1}).limit(20)
  if (!explorePostList || explorePostList.length === 0) {
    const ApiResponse =  SuccesAPI("Không có bài viết nào trong mục khám phá", []);
    return res.status(200).json(ApiResponse);
  }
  const formatPostList = await Promise.all(
      explorePostList.map(async (post) => {
        const isLiked = await Like.exists({ userID: req.userId, postID: post._id });
        const user = await User.findById(post.userID);
        return {
          id: post._id,
          userID: post.userID,
          fullname: user ? user.fullname : "Ẩn danh",
          avatar: user ? user.avatar : "",
          image: post.image,
          caption: post.caption,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          time: post.time,
          privacy: post.privacy,
          isLiked: !!isLiked,
        };
      })
    );
  const ApiResponse =  SuccesAPI("Lấy danh sách bài viết thành công", formatPostList);
  return res.status(200).json(ApiResponse);

})




module.exports = ExploreRouter;
