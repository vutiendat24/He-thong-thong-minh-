const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // tham chiếu tới model User
      required: true,
    },
  ],
  lastMessage: {
    type: String,
    ref: 'Message', // tham chiếu tin nhắn cuối cùng (giúp load nhanh)
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
