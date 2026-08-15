import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamQuestion",
      required: true,
    },
    selectedOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submittedAt: Date,
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: null,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["in-progress", "submitted", "graded"],
      default: "in-progress",
      index: true,
    },
  },
  { timestamps: true }
);

// One attempt per student per exam
examAttemptSchema.index({ exam: 1, student: 1 }, { unique: true });

export default mongoose.models.ExamAttempt || mongoose.model("ExamAttempt", examAttemptSchema);
