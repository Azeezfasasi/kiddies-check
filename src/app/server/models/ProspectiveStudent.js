import mongoose from "mongoose";

const prospectiveStudentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    enrollmentNo: String, // Will be generated when approved
    picture: String, // Cloudinary URL
    phone: String,
    email: String,
    
    // Class information
    gradeLevel: String,
    className: String,
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    
    // School information
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    schoolType: {
      type: String,
      enum: ['my-childs-school', 'home-school', ''],
      default: '',
    },

    // Parent information (who submitted the registration)
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    parentName: String,
    parentEmail: String,
    parentPhone: String,

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvalNotes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,
    rejectedAt: Date,

    // When approved, link to actual student
    approvedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
prospectiveStudentSchema.index({ school: 1, status: 1 });
prospectiveStudentSchema.index({ registeredBy: 1, school: 1 });
prospectiveStudentSchema.index({ createdAt: -1 });
prospectiveStudentSchema.index({ firstName: 1, lastName: 1, school: 1 });

export default mongoose.models.ProspectiveStudent || mongoose.model("ProspectiveStudent", prospectiveStudentSchema);
