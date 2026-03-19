import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderName: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const quoteSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  company: String,
  service: String,
  message: String,
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "replied", "closed"],
    default: "pending",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Quote || mongoose.model("Quote", quoteSchema);
