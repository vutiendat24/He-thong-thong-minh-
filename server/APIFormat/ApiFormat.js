

const ErrorCode = require("./ErrorCode")



const ErrorAPI = (mesage,errorCode) => {
  const error = ErrorCode[errorCode] || {};
  const status = error.status || 400;
  const message = mesage|| "Cannot find error code";

  return {
    success: false,
    message: message,
    status: status,
    errorCode: errorCode
  };
};

const SuccesAPI = (message, data) => {
  return {
    success: true,
    message: message,
    status: 200,
    data: data || null
  };
};


module.exports = {ErrorAPI, SuccesAPI}