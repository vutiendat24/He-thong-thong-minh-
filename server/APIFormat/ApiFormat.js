

const ErrorCode = require("./ErrorCode")



const ErrorAPI = (errorCode) => {
  const error = ErrorCode[errorCode] || {};
  const status = error.status || 400;
  const message = error.message || "Cannot find error code";

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
    data: data
  };
};


module.exports = {ErrorAPI, SuccesAPI}