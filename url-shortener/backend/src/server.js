import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  console.log('[System] Initializing URL Shortener Backend Service...');
  
  // 1. Connect MongoDB
  await connectDB();

  // 2. Connect Redis (Graceful optional cache)
  await connectRedis();

  // 3. Start Express HTTP Server
  app.listen(PORT, () => {
    console.log(`[Server] Running on ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
