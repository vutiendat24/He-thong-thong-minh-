const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { initSocket } = require('./socket/index.js');
const connectDB = require('./config/MongooseConf.js');
const neo4jConnect = require('./config/Neo4jConf.js');
const melodyRouter = require('./routes/melody/MelodyRoute.js');
const chatSocket = require('./socket/chatSocket');

connectDB();
neo4jConnect.ConnectNeo4j();
neo4jConnect.syncUsersToNeo4j();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // phải khớp với socket
}));

app.use('/melody', melodyRouter);

const httpServer = createServer(app);
const io = initSocket(httpServer);

// gắn handler socket riêng
// chatSocket(io);

app.set('io', io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
