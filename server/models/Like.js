const mongoose = require('mongoose');


const LikeSchema = new mongoose.Schema({
  userID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  postId: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true},
}, {timestamps: true});



module.exports = mongoose.model('Like', LikeSchema);