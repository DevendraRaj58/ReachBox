import 'dotenv/config';
import { app } from './app.js';
import { prisma } from './db/prisma.js';
import { redisConnection } from './queues/redis.js';
import { reconcileEmailQueue } from './services/queue-reconciliation.service.js';
import { initializeElasticsearch } from './services/elasticsearch.service.js';
const port = Number(process.env.PORT ?? 4000);

async function startServer() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected');

    await redisConnection.ping();
    console.log('Redis connected');

    await initializeElasticsearch();
    console.log('Elasticsearch initialized');
    
    await reconcileEmailQueue();
    console.log('Queue reconciled');

    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down...`);

  // 3. Gracefully disconnect Prisma and Redis
  await prisma.$disconnect();
  await redisConnection.quit();

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));