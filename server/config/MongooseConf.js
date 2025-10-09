const mongoose = require('mongoose')


const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/HeThongThongMinh')
    console.log('✅ MongoDB connected successfully')
  } catch (err) {
    console.error('❌ MongoDB connection error:', err)
  }
}

module.exports = { connectDB, mongoose }
