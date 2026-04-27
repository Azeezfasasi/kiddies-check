import mongoose from "mongoose";

const promotionRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
      index: true,
    },
    fromClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "From class is required"],
    },
    toClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "To class is required"],
    },
    academicSession: {
      type: String,
      required: [true, "Academic session is required"],
      trim: true,
      index: true,
    },
    promotionDate: {
      type: Date,
      default: Date.now,
    },
    promotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Promoter is required"],
    },
    status: {
      type: String,
      enum: ["promoted", "retained", "graduated"],
      default: "promoted",
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for common queries
promotionRecordSchema.index({ school: 1, academicSession: 1 });
promotionRecordSchema.index({ student: 1, academicSession: 1 });
promotionRecordSchema.index({ fromClass: 1, academicSession: 1 });
promotionRecordSchema.index({ createdAt: -1 });

export default mongoose.models.PromotionRecord ||
  mongoose.model("PromotionRecord", promotionRecordSchema);

