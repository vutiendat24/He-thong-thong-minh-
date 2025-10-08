



const ErrorCode = {
  USER_NOT_FOUND: {
    status: 404,
    message: "User does not exist"
  },
  INVALID_TOKEN: {
    status: 401,
    message: "Invalid or expired token"
  },
  TOKEN_EXPIRED: {
    status: 401,
    message: "Expired token"
  },
  MISSING_CONFIG_SERECT :{
    status: 401,
    message: "Missing config your serect in server"
  },
  MISSING_FIELD: {
    status: 400,
    message: "Missing required field"
  },
  PERMISSION_DENIED: {
    status: 403,
    message: "You do not have permission to perform this action"
  },
  INTERNAL_ERROR: {
    status: 500,
    message: "Internal server error"
  },
  FILE_NOT_EXIST: {
    status: 404,
    message: "File does not exist"  
  },
  ERROR_UPLOAD_CLOUDINARY: {
    status: 500,
    message: "Error upload file to Cloudinary"
  },
  EMAIL_EXISTS: {
    status: 400,
    message: "Email already exists"
  },


};
module.exports = ErrorCode
