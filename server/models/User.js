const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  fullname: { type: String, trim: true },
  avatar: { type: String },
  birthday: { type: Date },
  totalFollowing: { type: Number, default: 0 },
  totalFollower: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  online: {    type: Boolean,    default: false  },
  lastSeen: {    type: Date,    default: null  }
});

module.exports = mongoose.model('User', userSchema);
