import { Worker, DelayedError, type Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { redisConnection } from './redis.js';
import { EMAIL_QUEUE_NAME } from './email.queue.js';
import { env } from '../config/env.js';



import { prisma } from '../db/prisma.js';
import { sendEmail } from '../services/smtp.service.js';


import { checkRateLimit } from '../services/rate-limiter.service.js';



import { indexEmail } from '../services/elasticsearch.service.js';

import { notifyHourlyLimitReached } from '../services/slack.service.js';


interface SendEmailJob {
  emailId: string;
}

export const emailWorker = new Worker<SendEmailJob>(
  EMAIL_QUEUE_NAME,
  async (job: Job<SendEmailJob>) => {
    const { emailId } = job.data;

    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: {
        batch: true,
      },
    });

    if (!email) {
      throw new Error(`Email ${emailId} was not found`);
    }

    if (email.status === 'SENT') {
      return {
        skipped: true,
        reason: 'already-sent',
      };
    }

    const effectiveDelayMs = Math.max(
      email.batch.delayMs,
      env.MIN_DELAY_MS
    );

    const effectiveHourlyLimit = Math.min(
      email.batch.hourlyLimit,
      env.MAX_EMAILS_PER_HOUR_PER_SENDER
    );

    const rateLimit = await checkRateLimit(
      email.senderId,
      effectiveHourlyLimit,
      effectiveDelayMs
    );

    if (!rateLimit.allowed) {
      if (rateLimit.hourlyLimitReached) {
        await notifyHourlyLimitReached({
          userId: email.userId,
          senderId: email.senderId,
          hourlyLimit: effectiveHourlyLimit,
          nextAllowedAt: rateLimit.nextAllowedAt,
        });
      }
      const nextAttempt = Math.max(
        rateLimit.nextAllowedAt,
        Date.now() + effectiveDelayMs
      );

      await prisma.email.update({
        where: { id: emailId },
        data: {
          scheduledAt: new Date(nextAttempt),
        },
      });

      await job.moveToDelayed(nextAttempt, job.token);

      console.log(
        `Rate limit reached for ${email.senderId}. ` +
        `Rescheduled ${emailId} to ${new Date(nextAttempt).toISOString()}`
      );

      throw new DelayedError();
    }

    const claim = await prisma.email.updateMany({
      where: {
        id: emailId,
        status: { in: ['SCHEDULED', 'FAILED'] },
      },
      data: {
        status: 'PROCESSING',
        attempts: {
          increment: 1,
        },
      },
    });

    if (claim.count === 0) {
      const latestEmail = await prisma.email.findUnique({
        where: { id: emailId },
      });

      if (latestEmail?.status === 'SENT') {
        return {
          skipped: true,
          reason: 'already-sent',
        };
      }

      throw new Error(
        `Email ${emailId} could not be claimed for processing`
      );
    }

    try {
      const info = await sendEmail({
        senderId: email.senderId,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        emailId: email.id,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      const updatedEmail = await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          lastError: null,
        },
      });

      await indexEmail({
        emailId: updatedEmail.id,
        userId: updatedEmail.userId,
        batchId: updatedEmail.batchId,
        recipient: updatedEmail.recipient,
        subject: updatedEmail.subject,
        body: updatedEmail.body,
        senderId: updatedEmail.senderId,
        senderAddress: updatedEmail.senderAddress,
        status: updatedEmail.status,
        scheduledAt: updatedEmail.scheduledAt,
        sentAt: updatedEmail.sentAt,
        failedAt: updatedEmail.failedAt,
        attempts: updatedEmail.attempts,
        createdAt: updatedEmail.createdAt,
      });

      console.log(`Email sent: ${email.recipient}`);
      console.log(`Message ID: ${info.messageId}`);

      if (previewUrl) {
        console.log(`Ethereal preview: ${previewUrl}`);
      }

      return {
        sent: true,
        messageId: info.messageId,
        previewUrl,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown SMTP error';

      const updatedEmail = await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          lastError: message,
        },
      });

      await indexEmail({
        emailId: updatedEmail.id,
        userId: updatedEmail.userId,
        batchId: updatedEmail.batchId,
        recipient: updatedEmail.recipient,
        subject: updatedEmail.subject,
        body: updatedEmail.body,
        senderId: updatedEmail.senderId,
        senderAddress: updatedEmail.senderAddress,
        status: updatedEmail.status,
        scheduledAt: updatedEmail.scheduledAt,
        sentAt: updatedEmail.sentAt,
        failedAt: updatedEmail.failedAt,
        attempts: updatedEmail.attempts,
        createdAt: updatedEmail.createdAt,
      });

      console.error(
        `Failed to send ${emailId}: ${message}`
      );

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: env.WORKER_CONCURRENCY,
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Worker completed job ${job.id}`);
});

emailWorker.on('failed', (job, error) => {
  console.error(
    `Worker failed job ${job?.id}: ${error.message}`
  );
});