import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('[Redis] Max retries reached. Operating without cache layer.');
            return false; // Stop auto-reconnecting
          }
          return Math.min(retries * 500, 2000);
        }
      }
    });

    redisClient.on('error', (err) => {
      if (isConnected) {
        console.warn(`[Redis] Connection error: ${err.message}`);
      }
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connecting to server...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      console.log('[Redis] Connected and ready');
    });

    redisClient.on('end', () => {
      isConnected = false;
      console.warn('[Redis] Connection closed');
    });

    await redisClient.connect().catch((err) => {
      console.warn(`[Redis] Initial connection failed: ${err.message}. Backend will use MongoDB fallback.`);
    });
  } catch (error) {
    console.warn(`[Redis] Failed to initialize Redis client: ${error.message}`);
  }
};

export const getCache = async (key) => {
  if (!redisClient || !isConnected) return null;
  try {
    return await redisClient.get(key);
  } catch (err) {
    console.warn(`[Redis] Error getting key "${key}": ${err.message}`);
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds = 86400) => {
  if (!redisClient || !isConnected) return;
  try {
    if (ttlSeconds) {
      await redisClient.set(key, value, { EX: ttlSeconds });
    } else {
      await redisClient.set(key, value);
    }
  } catch (err) {
    console.warn(`[Redis] Error setting key "${key}": ${err.message}`);
  }
};

export const isRedisReady = () => isConnected;
