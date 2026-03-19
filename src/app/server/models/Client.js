import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
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

const ClientsCollectionSchema = new mongoose.Schema({
  clients: [ClientSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Client = mongoose.models.Client || mongoose.model('Client', ClientsCollectionSchema);

export default Client;
