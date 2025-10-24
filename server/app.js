const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/MongooseConf.js');
const melodyRouter = require('./routes/melody/MelodyRoute.js');
const neo4jConnect = require('./config/Neo4jConf.js');
const http = require('http');
const { Server } = require('socket.io');
const chatSocket = require('./socket/chatSocket');


connectDB();
neo4jConnect.ConnectNeo4j();
neo4jConnect.syncUsersToNeo4j()

const app = express();

// 🟩 1️⃣ Middleware parse body (PHẢI đặt TRƯỚC router)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// 🟩 2️⃣ CORS cấu hình trước router
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// 🟩 3️⃣ Router (đặt SAU cùng)
app.use('/melody', melodyRouter);

// 🟩 4️⃣ Chạy server với Socket.IO
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }
});

// cho phép router access io: req.app.get('io')
app.set('io', io);

// gắn handler socket
chatSocket(io);

server.listen(PORT, () => console.log(`🚀 Server + Socket.IO chạy tại http://localhost:${PORT}`));

