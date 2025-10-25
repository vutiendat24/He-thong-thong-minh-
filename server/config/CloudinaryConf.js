const cloudinary = require('cloudinary').v2
require('dotenv').config()

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.ClOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


module.exports = cloudinary
