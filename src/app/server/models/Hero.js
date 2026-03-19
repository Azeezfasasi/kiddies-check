import mongoose from "mongoose";

const HeroSlideSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  ctaLabel: {
    type: String,
    required: true,
  },
  ctaHref: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: "Slide image",
  },
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
});

const HeroSchema = new mongoose.Schema({
  slides: [HeroSlideSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Hero || mongoose.model("Hero", HeroSchema);
