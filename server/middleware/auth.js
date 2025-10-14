const jwt = require("jsonwebtoken")
const { ErrorAPI, SuccesAPI } = require("../APIFormat/ApiFormat")
const ErrorCode = require("../APIFormat/ErrorCode")


const verifyToken = (req, res, next) => {
  try {
    // lay phan token trong req ra 
    const authHeader = req.headers.authorization
    console.log(authHeader)
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      const { status } = ErrorCode["INVALID_TOKEN"]
      const respond = ErrorAPI("INVALID_TOKEN")
      console.log("loi o day")
      return res.status(status).json(respond)
    }
    // token gom 2 phan ten_token va token_key
    // tach 2 phan nay ra 
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      const { status } = ErrorCode["INVALID_TOKEN"]
      const respond = ErrorAPI("INVALID_TOKEN")
      return res.status(status).json(respond)
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const { status } = ErrorCode["MISSING_CONFIG_SERECT"]
      const respond = ErrorAPI("MISSING_CONFIG_SERECT")
      return res.status(status).json(respond)
    }

    // kiem tra token 
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    // token het han
    if (err.name === 'TokenExpiredError') {

      const { status } = ErrorCode["TOKEN_EXPIRED"]
      const respond = ErrorAPI("TOKEN_EXPIRED")
      return res.status(status).json(respond)
    }
      
    const { status } = ErrorCode["INVALID_TOKEN"]
    const respond = ErrorAPI("INVALID_TOKEN")
    return res.status(status).json(respond)
  }
}

module.exports = verifyToken


