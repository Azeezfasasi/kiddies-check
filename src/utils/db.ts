import mongoose from 'mongoose';
// Register all models so populate() never hits an unregistered ref
import '@/app/server/models';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ Database connection failed', error);
    throw error;
  }
};
