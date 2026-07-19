import mongoose from "mongoose";

const reportCardSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
      index: true,
    },
    cardType: {
      type: String,
      enum: ["nursery", "primary"],
      required: [true, "Card type is required"],
      index: true,
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
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    nurseryData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    primaryData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

reportCardSchema.index({ school: 1, cardType: 1, createdAt: -1 });
reportCardSchema.index({ school: 1, student: 1, term: 1, academicYear: 1 }, { unique: false });

export default mongoose.models.ReportCard || mongoose.model("ReportCard", reportCardSchema);
