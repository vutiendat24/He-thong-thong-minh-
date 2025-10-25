const mongoose = require("mongoose");
const { Schema } = mongoose;

const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: "User" }, // optional nhưng nên có
  content: { type: String, default: "" },
  image: { type: String, default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models?.Message || mongoose.model("Message", MessageSchema);
