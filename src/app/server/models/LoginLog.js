import mongoose from "mongoose";

const loginLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    firstName: String,
    lastName: String,
    userRole: {
      type: String,
      enum: ["admin", "school-leader", "teacher", "parent", "learning-specialist"],
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      index: true,
    },
    schoolName: String,
    loginTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: String,
    userAgent: String,
    deviceType: String, // mobile, tablet, desktop
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    failureReason: String, // e.g., "Invalid password", "User not found"
  },
  { timestamps: true }
);

// Index for efficient queries
loginLogSchema.index({ user: 1, loginTime: -1 });
loginLogSchema.index({ school: 1, loginTime: -1 });
loginLogSchema.index({ loginTime: -1 });

export default mongoose.models.LoginLog || mongoose.model("LoginLog", loginLogSchema);
