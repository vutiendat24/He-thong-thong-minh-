const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ["post", "comment"],
    required: true
  },

  targetId: {
    type: String,
    required: true,
    index: true
  },

  reporterId: {
    type: String,
    required: true
  },

  reason: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

ReportSchema.index(
  { targetType: 1, targetId: 1, reporterId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Report", ReportSchema);
