import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('Redis connected');
});

redisConnection.on('error', (error: Error) => {
  console.error('Redis error:', error);
});