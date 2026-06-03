

const express = require("express")
const User = require("../../../models/User");
const Post = require("../../../models/Post");
const Likes = require("../../../models/Like");
const { SuccesAPI, ErrorAPI } = require("../../../APIFormat/ApiFormat.js");
const verifyToken = require("../../../middleware/auth.js");
const {driver} = require("../../../config/Neo4jConf.js")

const SearchRouter = express.Router()

SearchRouter.get("/",verifyToken,  async (req, res) => {
  const userID = req.user.userID
  const rawQuery = req.query.searchQuery || "";
  const searchQuery = rawQuery.trim();
  console.log("Search Query:", searchQuery);

  // escape regex special chars to avoid unexpected behavior / ReDoS risks
  const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (!searchQuery) {
    const apiRes = SuccesAPI("Tìm kiếm thành công", { posts: [], users: [] });
    return res.status(200).json(apiRes);
  }

  try {
    const regex = new RegExp(escapeRegex(searchQuery), "i");
  
    const PostSearchList = await Post.find({ caption: { $regex: regex } })
        .select("_id userID  image likeCount commentCount time")
        .sort({ time: -1 })
        .limit(10)
        .lean()
    const formattedPostList = await Promise.all(
          PostSearchList.map(async (post) => {
            const postInfo = await User.findById(post.userID)
            .select("_id fullname avatar")
            .lean();
            const isLike = await Likes.findOne({ postID: post._id, userID: req.userID });
            
            return {
              ...post,
              isLike: !!isLike,
              fullname: postInfo?.fullname || "",
              avatar: postInfo?.avatar || "",
            };
          })
        );
        
        
    const userSearchList = await User.find({ fullname: { $regex: regex } })
        .select("_id fullname avatar totalFollower")
        .limit(10)
        .lean();
        
    const formattedUsers = await Promise.all(
      userSearchList.map(async (user) => {
        const session = driver.session();
        const result = await session.run(
          `MATCH (u1:User {id: $u1})
          MATCH (u2:User {id: $u2})
          OPTIONAL MATCH (u1)-[r:FRIEND]-(u2)
          RETURN r`,
          { u1: user._id.toString(), u2: userID }
        );

        await session.close();

        const record = result.records[0];
        const isFollowing = record ? record.get("r") !== null : false;

        return {
          ...user,
          isFollowing
        };
      })
    );
    const formattedResult = {
      posts: formattedPostList,
      users: formattedUsers
    };
    const apiRes = SuccesAPI("Tìm kiếm thành công", formattedResult);
    res.status(200).json(apiRes);
  } catch (error) {
    const apiRes = ErrorAPI("SEARCH_ERROR");
    console.log(error)
    res.status(500).json(apiRes);
  }
})

module.exports = SearchRouter
