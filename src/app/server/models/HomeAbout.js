import mongoose from "mongoose";

const HomeAboutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  paragraphs: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      text: String,
      order: Number,
    }
  ],
  image: {
    url: String,
    alt: String,
  },
  ctaButton: {
    label: {
      type: String,
      default: 'Learn More',
    },
    href: {
      type: String,
      default: '/about-us',
    },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.HomeAbout || mongoose.model("HomeAbout", HomeAboutSchema);
