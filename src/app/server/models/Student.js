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
    isActive: {
      type: Boolean,
      default: true,
    },
    admissionDate: Date,
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

export default mongoose.models.Student || mongoose.model("Student", studentSchema);
