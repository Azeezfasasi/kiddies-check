import mongoose from 'mongoose';

// Gallery Item Schema
const galleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Gallery title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['learning', 'education', 'infrastructure', 'technology', 'other'],
    default: 'learning',
  },
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true, // Cloudinary public ID for deletion
      },
      alt: {
        type: String,
        default: '',
      },
      displayOrder: {
        type: Number,
        default: 0,
      },
    },
  ],
  featured: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  businessName: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  views: {
    type: Number,
    default: 0,
  },
  tags: [String],
}, { timestamps: true });

// Index for better query performance
galleryItemSchema.index({ category: 1, status: 1 });
galleryItemSchema.index({ featured: 1, status: 1 });
galleryItemSchema.index({ createdAt: -1 });

// Virtual for image count
galleryItemSchema.virtual('imageCount').get(function() {
  return this.images?.length || 0;
});

const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', galleryItemSchema);

export default Gallery;
