import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    week: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: 0,
      max: 100,
    },
    maxScore: {
      type: Number,
      default: 100,
    },
    percentage: {
      type: Number,
      default: function () {
        return ((this.score / this.maxScore) * 100).toFixed(2);
      },
    },
    gradeLevel: {
      type: String,
      enum: ["A", "B", "C", "D", "F"],
    },
    remarks: String,
    assessmentType: {
      type: String,
      enum: ["assignment", "quiz", "test", "project", "participation"],
      default: "assignment",
    },
    teacher: {
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

// Compound indexes for school isolation and efficient queries
assessmentSchema.index({ school: 1, student: 1 });
assessmentSchema.index({ school: 1, subject: 1 });
assessmentSchema.index({ school: 1, class: 1 });
assessmentSchema.index({ school: 1, student: 1, subject: 1 });
assessmentSchema.index({ school: 1, week: 1, year: 1 });
assessmentSchema.index({ date: 1 });

export default mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);
