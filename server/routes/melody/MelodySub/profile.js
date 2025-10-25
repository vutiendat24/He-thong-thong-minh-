

const express = require("express")
const verifyToken = require("../../../middleware/auth.js");
const User = require("../../../models/User");
const { SuccesAPI } = require("../../../APIFormat/ApiFormat.js");
const ProfileRouter = express.Router()

ProfileRouter.get("/get-profile/:userID", verifyToken, async (req, res) => {
  const { userID } = req.params;
  const profileData = await User.findById(userID).select("fullname avatar totalPost totalFollowing totalFollower");
  if (!profileData) {
    const errorResponse = ErrorAPI("USER_NOT_FOUND")
    return res.status(errorResponse.status).json(errorResponse);
  }

  const apiRes = SuccesAPI("Lấy thông tin người dùng thành công", profileData);
  res.status(200).json(apiRes);

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
module.exports = ProfileRouter

