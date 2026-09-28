import { prisma } from '../db/prisma.js';
import { emailQueue } from '../queues/email.queue.js';

export async function reconcileEmailQueue() {
  const pendingEmails = await prisma.email.findMany({
    where: {
      dispatchStatus: 'PENDING',
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
    `Queue reconciliation: recovering ${pendingEmails.length} email(s).`
  );

  for (const email of pendingEmails) {
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
  }

  console.log('Queue reconciliation completed.');
}