
// const {mongoose} = require('../config/MongooseConf');

const mongoose = require('mongoose');




const CommentSchema = new mongoose.Schema({
  postId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes:    { type: Number, default: 0 },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', CommentSchema);
