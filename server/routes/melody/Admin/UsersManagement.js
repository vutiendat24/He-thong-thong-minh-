const express = require("express")
const UsersRouter = express.Router()

const User = require("../../../models/User");
const verifyToken = require("../../../middleware/auth");


const getRandomRecentDate = (days = 7) => {
  const end = new Date(); 
  const start = new Date();
  start.setDate(end.getDate() - days);

  const randomTimestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTimestamp);
};



UsersRouter.get("/users",async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    const formattedUsers = users.filter(user => user.role !== "ADMIN").map(user => {
      return {
        ...user, 
        lastLoginAt: user.lastSeen,
      };
    });

    return res.status(200).json(formattedUsers);

  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
});

module.exports = UsersRouter