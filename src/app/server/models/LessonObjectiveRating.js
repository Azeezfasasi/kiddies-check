import mongoose from "mongoose";

const objectiveRatingSchema = new mongoose.Schema({
  objective: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  achieved: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  evidence: {
    type: String,
    trim: true,
  },
});

const lessonObjectiveRatingSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    lessonTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LessonTemplate",
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
    objectives: [objectiveRatingSchema],
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    overallComment: {
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

lessonObjectiveRatingSchema.index({ school: 1, teacher: 1 });
lessonObjectiveRatingSchema.index({ school: 1, class: 1 });
lessonObjectiveRatingSchema.index({ school: 1, week: 1, year: 1 });
lessonObjectiveRatingSchema.index({ school: 1, date: 1 });

export default mongoose.models.LessonObjectiveRating ||
  mongoose.model("LessonObjectiveRating", lessonObjectiveRatingSchema);

