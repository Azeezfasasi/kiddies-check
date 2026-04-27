import mongoose from "mongoose";

const academicObjectiveSchema = new mongoose.Schema({
  objective: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  curriculumArea: {
    type: String,
    trim: true,
  },
  targetLevel: {
    type: String,
    enum: ["below", "at", "above", "exceeding"],
    default: "at",
  },
  achievedLevel: {
    type: String,
    enum: ["below", "at", "above", "exceeding", "not-assessed"],
    default: "not-assessed",
  },
  progressRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  evidence: {
    type: String,
    trim: true,
  },
});

const academicObjectiveRatingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
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
    term: {
      type: String,
      enum: ["first", "second", "third"],
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
    objectives: [academicObjectiveSchema],
    overallProgress: {
      type: Number,
      min: 1,
      max: 5,
    },
    teacherComment: {
      type: String,
      trim: true,
    },
    nextSteps: {
      type: String,
      trim: true,
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

academicObjectiveRatingSchema.index({ school: 1, student: 1 });
academicObjectiveRatingSchema.index({ school: 1, subject: 1 });
academicObjectiveRatingSchema.index({ school: 1, term: 1, year: 1 });
academicObjectiveRatingSchema.index({ school: 1, date: 1 });

export default mongoose.models.AcademicObjectiveRating ||
  mongoose.model("AcademicObjectiveRating", academicObjectiveRatingSchema);

