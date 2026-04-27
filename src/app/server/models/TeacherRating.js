import mongoose from "mongoose";

const ratingDimensionSchema = new mongoose.Schema({
  dimension: {
    type: String,
    required: true,
    enum: [
      "lesson_planning",
      "instructional_delivery",
      "classroom_management",
      "student_engagement",
      "assessment_practices",
      "differentiation",
      "professionalism",
      "communication",
      "subject_knowledge",
      "use_of_resources",
      "feedback_quality",
      "pupil_progress",
    ],
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  evidence: {
    type: String,
    trim: true,
  },
});

const teacherRatingSchema = new mongoose.Schema(
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
    ratingType: {
      type: String,
      enum: ["formal", "informal", "peer", "self", "observation"],
      default: "formal",
    },
    week: {
      type: Number,
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
    dimensions: [ratingDimensionSchema],
    overallScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    overallComment: {
      type: String,
      trim: true,
    },
    strengths: [{
      type: String,
      trim: true,
    }],
    developmentAreas: [{
      type: String,
      trim: true,
    }],
    actionPlan: {
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

teacherRatingSchema.index({ school: 1, teacher: 1 });
teacherRatingSchema.index({ school: 1, ratingType: 1 });
teacherRatingSchema.index({ school: 1, week: 1, year: 1 });
teacherRatingSchema.index({ school: 1, date: 1 });

export default mongoose.models.TeacherRating ||
  mongoose.model("TeacherRating", teacherRatingSchema);

