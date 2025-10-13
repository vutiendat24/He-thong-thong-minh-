

const express = require("express")
const verifyToken = require("../../../middleware/auth.js");
const User = require("../../../models/User");
const { SuccesAPI } = require("../../../APIFormat/ApiFormat.js");
const ProfileRouter = express.Router()

ProfileRouter.get("/get-profile/:userID",verifyToken, async(req, res) => {
  const { userID } = req.params;
  const profileData = await User.findById(userID).select("fullname avatar totalPost totalFollowing totalFollower");
  if (!profileData) {
    const errorResponse = ErrorAPI("USER_NOT_FOUND")
    return res.status(errorResponse.status).json(errorResponse);
  }
  
  const apiRes = SuccesAPI("Lấy thông tin người dùng thành công", profileData);
  res.status(200).json(apiRes);

})  

module.exports = ProfileRouter

