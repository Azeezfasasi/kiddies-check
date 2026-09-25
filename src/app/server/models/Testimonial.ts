import mongoose from 'mongoose';
import { defineModel } from "./defineModel";

const TestimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5,
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

const TestimonialsCollectionSchema = new mongoose.Schema({
  testimonials: [TestimonialSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Testimonial = defineModel("Testimonial", TestimonialsCollectionSchema);

export default Testimonial;
