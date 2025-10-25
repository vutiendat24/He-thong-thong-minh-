

const mongoose = require('mongoose');



const Notification = new mongoose.Schema({
  type: { type: String, enum: ['like' , 'comment' , 'follow']},
  senderId: {type: String, require: true} ,
  receiverId: {type: String, require: true} ,
  postId:  { type: String, required: true },
  // commentId : { type: String  },
  // message:  { type: String, required: true },
  isRead: {type: Boolean},
  createdAt: { type: Date, default: Date.now }
 
})
module.exports = mongoose.model("notification", Notification)