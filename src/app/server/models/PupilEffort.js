import mongoose from "mongoose";

const effortCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      "participation",
      "homework_completion",
      "classwork_completion",
      "behavior",
      "collaboration",
      "independent_work",
      "listening_skills",
      "organization",
      "perseverance",
      "self_reflection",
    ],
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
});

const pupilEffortSchema = new mongoose.Schema(
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
      min: 1,
      max: 52,
    },
    year: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    efforts: [effortCategorySchema],
    overallEffort: {
      type: Number,
      min: 1,
      max: 5,
    },
    overallComment: {
      type: String,
      trim: true,
    },
    improvementAreas: [{
      type: String,
      trim: true,
    }],
    strengths: [{
      type: String,
      trim: true,
    }],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

pupilEffortSchema.index({ school: 1, student: 1 });
pupilEffortSchema.index({ school: 1, class: 1 });
pupilEffortSchema.index({ school: 1, week: 1, year: 1 });
pupilEffortSchema.index({ school: 1, date: 1 });

export default mongoose.models.PupilEffort ||
  mongoose.model("PupilEffort", pupilEffortSchema);

