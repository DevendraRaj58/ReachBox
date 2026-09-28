import { Queue } from 'bullmq';
import { redisConnection } from './redis.js';

export const EMAIL_QUEUE_NAME = 'email-send';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: {
      age: 60 * 60,
    },
    removeOnFail: false,
  },
});