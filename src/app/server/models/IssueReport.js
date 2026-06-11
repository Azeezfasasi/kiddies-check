import mongoose from "mongoose";

const issueReportSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      enum: [
        "login",
        "data-entry",
        "attendance",
        "performance",
        "ui-ux",
        "notification",
        "integration",
        "other",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        uploadedAt: Date,
      },
    ],
    comments: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        userName: String,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolvedAt: Date,
    resolvedBy: mongoose.Schema.Types.ObjectId,
    resolutionNotes: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    environmentInfo: {
      userAgent: String,
      screenResolution: String,
      browser: String,
      os: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
issueReportSchema.index({ user: 1, reportedAt: -1 });
issueReportSchema.index({ school: 1, reportedAt: -1 });
issueReportSchema.index({ status: 1, reportedAt: -1 });
issueReportSchema.index({ severity: 1, reportedAt: -1 });
issueReportSchema.index({ reportedAt: -1 });

export default mongoose.models.IssueReport || mongoose.model("IssueReport", issueReportSchema);
