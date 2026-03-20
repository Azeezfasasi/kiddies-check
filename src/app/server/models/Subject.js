import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    description: String,
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    creditHours: Number,
    curriculum: String,
    assessmentType: {
      type: String,
      enum: ["formative", "summative", "both"],
      default: "formative",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound indexes for school isolation and performance
subjectSchema.index({ school: 1, name: 1 });
subjectSchema.index({ school: 1, isActive: 1 });
subjectSchema.index({ school: 1, teacher: 1 });

export default mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
