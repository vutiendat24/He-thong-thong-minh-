



const ErrorCode = {
  USER_NOT_FOUND: {
    status: 404,
    message: "User does not exist"
  },
  INVALID_TOKEN: {
    status: 401,
    message: "Invalid token"
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
  CAN_NOT_GET_POST_LIST : {
    status :500,
    mesage :"Can not get post list"
  },
  CAN_NOT_GET_COMMENT_BY_POSTID : {
    status: 500,
    message: "CAN NOT GET COMMENT BECAUSE ERROR SERVER"
  },
  SEARCH_ERROR : {
    status: 500,
    message: "CAN NOT SEARCH DUE TO SERVER ERROR"
  },
  UPDATE_PROFILE_ERROR : {
    status: 500,
    message: "CAN NOT UPDATE PROFILE DUE TO SERVER ERROR"
  }





};
module.exports = ErrorCode
