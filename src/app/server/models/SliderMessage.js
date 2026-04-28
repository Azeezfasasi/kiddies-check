import mongoose from "mongoose";

const SliderMessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, "Message text is required"],
    trim: true,
    maxlength: [300, "Message cannot exceed 300 characters"],
  },
  link: {
    type: String,
    trim: true,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  bgColor: {
    type: String,
    default: "#1e3a8a", // blue-900
  },
  textColor: {
    type: String,
    default: "#ffffff",
  },
  icon: {
    type: String,
    default: "", // optional lucide icon name
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on every save
SliderMessageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.SliderMessage ||
  mongoose.model("SliderMessage", SliderMessageSchema);

