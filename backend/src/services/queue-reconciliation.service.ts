import { prisma } from '../db/prisma.js';
import { emailQueue } from '../queues/email.queue.js';

export async function reconcileEmailQueue() {
  const pendingEmails = await prisma.email.findMany({
    where: {
      status: 'SCHEDULED',
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  });

  if (pendingEmails.length === 0) {
    console.log('Queue reconciliation: nothing to recover.');
    return;
  }

  console.log(
    `Queue reconciliation: checking ${pendingEmails.length} scheduled email(s).`
  );

  for (const email of pendingEmails) {
    const existingJob = await emailQueue.getJob(email.bullJobId);

    if (existingJob) {
      continue;
    }

    const delay = Math.max(
      0,
      email.scheduledAt.getTime() - Date.now()
    );

    await emailQueue.add(
      'send-email',
      {
        emailId: email.id,
      },
      {
        jobId: email.bullJobId,
        delay,
      }
    );

    await prisma.email.update({
      where: {
        id: email.id,
      },
      data: {
        dispatchStatus: 'QUEUED',
      },
    });

    console.log(
      `Queue reconciliation: restored email ${email.id}.`
    );
  }

  console.log('Queue reconciliation completed.');
}