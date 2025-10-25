const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require( 'socket.io');
const connectDB = require('./config/MongooseConf.js');
const melodyRouter = require('./routes/melody/MelodyRoute.js');
const {initSocket} = require('./socket/index.js');


const app = express();
app.use(express.json());

connectDB();

app.use(
  cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
}));

const httpServer = createServer(app);

const io= initSocket(httpServer)
app.set("io",io)


app.use('/melody', melodyRouter);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));





