import mongoose from 'mongoose';
import { defineModel } from "./defineModel";

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

const Milestone = defineModel("Milestone", MilestonesCollectionSchema);

export default Milestone;
