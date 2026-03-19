import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userName: String,
  userEmail: String,
  userAvatar: String,
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BlogSchema = new mongoose.Schema({
  postTitle: { type: String, required: true },
  urlSlug: { type: String, required: true, unique: true },
  author: { type: String, required: true },
  publishDate: { type: Date, default: Date.now },
  content: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  featuredImage: { type: String },
  blogImages: [{ type: String }],
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [commentSchema],
}, { timestamps: true });

export default mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
