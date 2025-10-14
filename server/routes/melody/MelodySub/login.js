
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {mongoose} = require('../../../config/MongooseConf');
require('dotenv').config();

const {ErrorAPI, SuccesAPI} = require("../../../APIFormat/ApiFormat")
const User = require('../../../models/User');
const ErrorCode = require('../../../APIFormat/ErrorCode');

const LoginRouter = express.Router();



// ====== Đăng ký ======
LoginRouter.post('/sign-up', async (req, res) => {
  try {
    const { name, sex, email, birthday, password } = req.body;
    if (!name || !email || !password) {
      const {status, message} = ErrorCode['MISSING_FIELDS'];
      const APiResponse = ErrorAPI('MISSING_FIELDS');
      return res.status(status).json(APiResponse);
    
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const {status, message} = ErrorCode['EMAIL_EXISTS'];
      const APiResponse = ErrorAPI('EMAIL_EXISTS');
      return res.status(status).json(APiResponse);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname: name,
      sex: sex || 'Nam',
      email,
      birthday,
      password: hashedPassword,
      
    });

    await newUser.save();
    const APiResponse = SuccesAPI('Đăng ký thành công', null);
    res.status(200).json(APiResponse);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

LoginRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const payload = {
      userID: user._id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });
    const ApiResponse = SuccesAPI('Đăng nhập thành công', { token, userID: user._id });
    res.status(200).json(ApiResponse);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});


module.exports = LoginRouter;
