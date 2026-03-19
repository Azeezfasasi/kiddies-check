import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  category: { type: String, required: true },
  clientName: { type: String },
  location: { type: String },
  projectDescription: { type: String },
  startDate: { type: Date },
  expectedEndDate: { type: Date },
  budget: { type: Number },
  completion: { type: Number, min: 0, max: 100, default: 0 },
  projectStatus: {
    type: String,
    enum: [
      "pending",
      "in-progress",
      "completed",
      "planning",
      "on hold",
      "disabled"
    ],
    default: "planning"
  },
  teamLead: { type: String },
  teamMembers: [{ type: String }],
  technologies: [{ type: String }],
  materialsUsed: [{ type: String }],
  projectHighlights: { type: String },
  featuredImage: { type: String }, // Cloudinary URL
  galleryImages: [{ type: String }], // Array of Cloudinary URLs
  isDisabled: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Project || mongoose.model("Project", projectSchema);