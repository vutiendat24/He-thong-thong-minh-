const express = require("express")
const DashboarRouter = express.Router()

const verifyToken = require("../../../middleware/auth");


const DailyStats = require("../../../models/DailyStats")
const User = require("../../../models/User")



DashboarRouter.get("/weekly",  async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 7; 

    const stats = await DailyStats.find()
      .sort({ createdAt: -1 }) 
      .limit(limit);
    
    const sortedStats = stats.reverse().map(stat => {
        const item = stat.toObject(); 
        const datePart = item._id.replace('daily_', '').replace(/_/g, '-');
        return {
            ...item,
            date: datePart 
        };
    });
    
    res.status(200).json(sortedStats);

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

DashboarRouter.get("/daily",  async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1; 

    const stats = await DailyStats.find()
      .sort({ createdAt: -1 }) 
      .limit(limit);
    
    const sortedStats = stats.reverse();
    const totalUsers = await User.countDocuments();
    const finalData = sortedStats.map(stat => {
        return {
          ...stat._doc, 
          totalUsers: totalUsers
        };
});
    res.status(200).json(finalData);

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


module.exports = DashboarRouter
