import mongoose from "mongoose";

const assessmentTrendSchema = new mongoose.Schema(
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
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    weeklyScores: [
      {
        week: Number,
        score: Number,
        date: Date,
        assessmentType: String,
      },
    ],
    averageScore: {
      type: Number,
      default: 0,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    lowestScore: {
      type: Number,
      default: 0,
    },
    totalAssessments: {
      type: Number,
      default: 0,
    },
    trend: {
      type: String,
      enum: ["improving", "declining", "stable"],
      default: "stable",
    },
    trendPercentage: {
      type: Number,
      default: 0,
    },
    lastUpdate: {
      type: Date,
      default: Date.now,
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
assessmentTrendSchema.index({ school: 1, student: 1, subject: 1 });
assessmentTrendSchema.index({ school: 1, student: 1 });
assessmentTrendSchema.index({ school: 1, year: 1 });
assessmentTrendSchema.index({ school: 1, class: 1, year: 1 });

export default mongoose.models.AssessmentTrend || mongoose.model("AssessmentTrend", assessmentTrendSchema);
