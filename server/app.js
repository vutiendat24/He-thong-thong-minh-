const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/MongooseConf.js');
const melodyRouter = require('./routes/melody/MelodyRoute.js');

connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));


app.use(express.json());
app.use('/melody', melodyRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
