import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const MilestonesCollectionSchema = new mongoose.Schema({
  milestones: [MilestoneSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Milestone = mongoose.models.Milestone || mongoose.model('Milestone', MilestonesCollectionSchema);

export default Milestone;
