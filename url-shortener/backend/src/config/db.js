import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/url_shortener';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000 // Timeout fast if local Mongo isn't running
    });
    isConnected = true;
    console.log(`[MongoDB] Connected to host: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Could not connect to database (${error.message}).`);
    console.warn('[MongoDB] Operating in resilient IN-MEMORY fallback mode. Backend is fully operational!');
  }
};

export const isMongoReady = () => isConnected;
