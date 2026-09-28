import { prisma } from '../db/prisma.js';
import { emailQueue } from '../queues/email.queue.js';
import { indexEmail } from './elasticsearch.service.js';


interface ScheduleEmailInput {
  userId: string;
  subject: string;
  body: string;
  recipients: string[];
  senderId: string;
  senderAddress: string;
  startTime: Date;
  delayMs: number;
  hourlyLimit: number;
}

export async function scheduleEmails(input: ScheduleEmailInput) {
  const {
    userId,
    subject,
    body,
    recipients,
    senderId,
    senderAddress,
    startTime,
    delayMs,
    hourlyLimit,
  } = input;

  if (recipients.length === 0) {
    throw new Error('At least one recipient is required');
  }

  if (startTime.getTime() <= Date.now()) {
    throw new Error('Start time must be in the future');
  }

  if (delayMs < 0) {
    throw new Error('Delay cannot be negative');
  }

  if (hourlyLimit <= 0) {
    throw new Error('Hourly limit must be greater than zero');
  }

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.scheduleBatch.create({
      data: {
        userId,
        subject,
        body,
        startTime,
        delayMs,
        hourlyLimit,
        totalEmails: recipients.length,
      },
    });

    const emails = [];

    for (let index = 0; index < recipients.length; index++) {
      const recipient = recipients[index]?.trim();

if (!recipient) {
  continue;
}

const scheduledAt = new Date(
  startTime.getTime() + index * delayMs,
);

      const email = await tx.email.create({
        data: {
          batchId: batch.id,
          userId,
          recipient,
          subject,
          body,
          senderId,
          senderAddress,
          scheduledAt,
          bullJobId: `email:${batch.id}:${index}`,
        },
      });

      emails.push(email);
    }

    return {
      batch,
      emails,
    };
  });

  /*
   * PostgreSQL is committed before jobs are placed into Redis.
   *
   * We intentionally keep this separate for now because later
   * we will add queue-reconciliation logic so a crash between
   * these two operations cannot permanently lose an email.
   */
  for (const email of result.emails) {
    const delay = Math.max(
      0,
      email.scheduledAt.getTime() - Date.now(),
    );

    await emailQueue.add(
      'send-email',
      {
        emailId: email.id,
      },
      {
        jobId: email.bullJobId,
        delay,
      },
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

  for (const email of result.emails) {
  await indexEmail({
    emailId: email.id,
    userId: email.userId,
    batchId: email.batchId,
    recipient: email.recipient,
    subject: email.subject,
    body: email.body,
    senderId: email.senderId,
    senderAddress: email.senderAddress,
    status: email.status,
    scheduledAt: email.scheduledAt,
    sentAt: email.sentAt,
    failedAt: email.failedAt,
    attempts: email.attempts,
    createdAt: email.createdAt,
  });
  }
  return result;
}