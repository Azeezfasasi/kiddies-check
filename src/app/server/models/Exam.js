import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
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
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },
    term: {
      type: String,
      required: [true, "Term is required"],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: 1,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
      index: true,
    },
    availableFrom: Date,
    availableUntil: Date,
    accessCode: {
      type: String,
      index: true,
      sparse: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

examSchema.index({ school: 1, class: 1, status: 1 });
examSchema.index({ school: 1, subject: 1 });

export default mongoose.models.Exam || mongoose.model("Exam", examSchema);
