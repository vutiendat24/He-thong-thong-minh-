// models/DailyStats.js
const mongoose = require('mongoose');

const DailyStatsSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  },

  newUsers: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  totalPosts: { type: Number, default: 0 },
  reportsToday: { type: Number, default: 0 },

  reportByReason: {
    hate_speech: { type: Number, default: 0 },
    spam:        { type: Number, default: 0 },
    nudity:      { type: Number, default: 0 },
    violence:    { type: Number, default: 0 },
    fake_news:   { type: Number, default: 0 },
    toxic:   { type: Number, default: 0 },
    severe_toxic:   { type: Number, default: 0 },
    obscene:   { type: Number, default: 0 },
    threat:   { type: Number, default: 0 },
    insult:   { type: Number, default: 0 },
    identity_hate:   { type: Number, default: 0 },
    other:       { type: Number, default: 0 }
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});



module.exports = mongoose.model('DailyStats', DailyStatsSchema);