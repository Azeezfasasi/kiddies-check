import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
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
    email: {
      type: String,
      lowercase: true,
      sparse: true,
    },
    enrollmentNo: {
      type: String,
      unique: true,
      sparse: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    guardian: {
      name: String,
      phone: String,
      email: String,
      relationship: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    phone: String,
    medicalInfo: String,
    photo: String,
    schoolType: {
      type: String,
      enum: ['my-childs-school', 'home-school', ''],
      default: '',
      description: 'Type of school (My Child\'s School or Home School)',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    admissionDate: Date,
    // Parent assignment
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    parentAssignedAt: Date,
    parentAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Compound index for school + class isolation
studentSchema.index({ school: 1, class: 1 });
studentSchema.index({ school: 1, firstName: 1, lastName: 1 });
studentSchema.index({ school: 1, isActive: 1 });
studentSchema.index({ parent: 1 }); // For parent to view their students
studentSchema.index({ school: 1, parent: 1 }); // Combined for efficient queries

export default mongoose.models.Student || mongoose.model("Student", studentSchema);
