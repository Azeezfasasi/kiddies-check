import mongoose from 'mongoose';
import { defineModel } from "./defineModel";

const TeamSchema = new mongoose.Schema(
  {
    members: [
      {
        name: {
          type: String,
          required: true,
        },
        position: {
          type: String,
          required: true,
        },
        photo: {
          type: String,
          required: true,
        },
        bio: {
          type: String,
          default: '',
        },
        order: {
          type: Number,
          default: 0,
        },
        active: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Team = defineModel("Team", TeamSchema);

export default Team;
