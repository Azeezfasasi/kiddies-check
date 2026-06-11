import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: String,
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
    action: {
      type: String,
      enum: [
        "create",
        "update",
        "delete",
        "view",
        "export",
        "import",
        "mark-attendance",
        "assign-parent",
        "upload-notebook",
        "send-feedback",
        "other",
      ],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: [
        "student",
        "class",
        "attendance",
        "user",
        "school",
        "feedback",
        "notebook",
        "parent",
        "other",
      ],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    entityName: String, // e.g., student name, class name
    description: String, // Human-readable description
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    errorMessage: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: String,
  },
  { timestamps: true }
);

// Index for efficient queries
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ school: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

export default mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
