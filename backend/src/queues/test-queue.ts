import { emailQueue } from './email.queue.js';

const job = await emailQueue.add(
  'test-email',
  {
    recipient: 'test@example.com',
    subject: 'BullMQ test',
  },
  {
    delay: 3000,
  },
);

console.log(`Added job: ${job.id}`);

process.exit(0);