// const mongoose = require('mongoose')


// const connectDB = async () => {
//   try {
//     await mongoose.connect('mongodb://127.0.0.1:27017/HeThongThongMinh')
//     console.log('✅ MongoDB connected successfully')
//   } catch (err) {
//     console.error('❌ MongoDB connection error:', err)
//   }
// }

// module.exports = {connectDB, mongoose}



// db.js
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