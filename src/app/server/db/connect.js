import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

/**
 * Global MongoDB connection cache
 * Prevents creating multiple connections in serverless environments
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  // Return existing connection if already connected
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  // Return existing promise if connection is in progress
  if (cached.promise) {
    console.log('⏳ Waiting for MongoDB connection...');
    return cached.promise;
  }

  // Create new connection with pooling
  cached.promise = mongoose.connect(MONGODB_URI, {
    // Connection pooling
    maxPoolSize: 10, // Maximum connections in the pool
    minPoolSize: 2, // Minimum connections to maintain
    maxIdleTimeMS: 45000, // Close idle connections after 45 seconds
    retryWrites: true,
    retryReads: true,
    // Timeouts
    serverSelectionTimeoutMS: 5000, // 5 seconds to select a server
    connectTimeoutMS: 10000, // 10 seconds to connect
    socketTimeoutMS: 45000, // 45 seconds for socket operations
  });

  try {
    cached.conn = await cached.promise;
    console.log('✅ MongoDB connected with connection pooling enabled');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      cached.conn = null;
      cached.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      cached.conn = null;
      cached.promise = null;
    });

    return cached.conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    cached.promise = null;
    throw error;
  }
};

/**
 * Gracefully close the database connection
 * Useful for cleanup in serverless environments
 */
export const disconnectDB = async () => {
  try {
    if (cached.conn) {
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
      console.log('✅ MongoDB disconnected');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

