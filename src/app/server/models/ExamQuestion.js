import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Option text is required"],
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const examQuestionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["single-choice", "true-false"],
      default: "single-choice",
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: function (options) {
          return options.length >= 2 && options.filter((o) => o.isCorrect).length === 1;
        },
        message: "A question needs at least two options with exactly one marked correct",
      },
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

examQuestionSchema.index({ exam: 1, order: 1 });

export default mongoose.models.ExamQuestion || mongoose.model("ExamQuestion", examQuestionSchema);
