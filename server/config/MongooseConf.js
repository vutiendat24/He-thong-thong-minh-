
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_CLOUD_URI

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function connectDB() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Successfully connected to MongoDB!");
    // Kiểm tra kết nối bằng lệnh ping
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. Connection is active!");
    return mongoose.connection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }  
}

module.exports = connectDB;
