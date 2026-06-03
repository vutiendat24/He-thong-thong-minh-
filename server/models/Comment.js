
const mongoose = require('mongoose');




const CommentSchema = new mongoose.Schema({
  postId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userID:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, required: true },
  isVisible:     { type: Boolean,  },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes:    { type: Number, default: 0 },
  createdAt:{ type: Date, default: Date.now },
  reasons: { type: [String], default: [] },
  reportCount: { type: Number, default: 0 },
  

});

module.exports = mongoose.model('Comment', CommentSchema);
