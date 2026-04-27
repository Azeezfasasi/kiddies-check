import mongoose from "mongoose";

const ratingCriteriaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  maxScore: {
    type: Number,
    default: 5,
    min: 1,
    max: 10,
  },
  weight: {
    type: Number,
    default: 1,
    min: 0,
    max: 10,
  },
});

const lessonTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "bi-weekly", "monthly"],
      default: "daily",
    },
    criteria: [ratingCriteriaSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

lessonTemplateSchema.index({ school: 1, isActive: 1 });
lessonTemplateSchema.index({ school: 1, frequency: 1 });

export default mongoose.models.LessonTemplate ||
  mongoose.model("LessonTemplate", lessonTemplateSchema);

