import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorRole: {
      type: String,
      enum: ["teacher", "admin", "school-leader", "learning-specialist", "parent"],
      required: true,
    },
    category: {
      type: String,
      enum: ["academic", "behavior", "attendance", "personal", "health", "general"],
      default: "general",
    },
    title: {
      type: String,
      required: [true, "Feedback title is required"],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Feedback comment is required"],
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    attachments: [
      {
        url: String,
        name: String,
        type: String,
      },
    ],
    isVisible: {
      type: Boolean,
      default: true,
    },
    replies: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        authorRole: {
          type: String,
          enum: ["teacher", "admin", "school-leader", "learning-specialist", "parent"],
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
feedbackSchema.index({ student: 1, school: 1 });
feedbackSchema.index({ author: 1 });
feedbackSchema.index({ school: 1, createdAt: -1 });
feedbackSchema.index({ student: 1, authorRole: 1 });

export default mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
