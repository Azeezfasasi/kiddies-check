import mongoose from "mongoose";

const ServiceDetailSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  section: String,
  text: String,
  items: [String],
  order: Number,
});

const ServiceSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: {
    type: String,
    required: true,
  },
  shortDesc: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  details: [ServiceDetailSchema],
  icon: String,
  color: {
    type: String,
    default: 'from-blue-600 to-blue-700',
  },
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      publicId: String,
      alt: String,
      order: {
        type: Number,
        default: 0,
      },
    },
  ],
  order: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
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

const ServicesCollectionSchema = new mongoose.Schema({
  services: [ServiceSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Services || mongoose.model("Services", ServicesCollectionSchema);
