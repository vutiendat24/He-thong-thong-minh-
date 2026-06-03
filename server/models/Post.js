const mongoose = require('mongoose');


const PostSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true },
    image: { type: String },
    caption: { type: String, default: '' },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    privacy: { type: String, enum: ['public', 'friend', 'private'], default: 'public' },
    reasons: { type: [String], default: [] },
    reportCount: { type: Number, default: 0 }
  }
);

module.exports = mongoose.model('Post', PostSchema);
