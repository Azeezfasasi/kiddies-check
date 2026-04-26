import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      default: "present",
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    markedVia: {
      type: String,
      enum: ["qr-scan", "manual"],
      default: "manual",
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
attendanceSchema.index({ school: 1, date: 1 });
attendanceSchema.index({ student: 1, date: 1 }, { unique: true }); // One attendance record per student per day
attendanceSchema.index({ school: 1, student: 1, date: -1 });

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

