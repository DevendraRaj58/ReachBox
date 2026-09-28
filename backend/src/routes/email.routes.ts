import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { scheduleEmails } from '../services/email-scheduler.service.js';
import { searchEmails } from '../services/elasticsearch.service.js';

const router = Router();

const scheduleSchema = z.object({
  userId: z.string().min(1),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  recipients: z
    .array(z.string().email())
    .min(1),
  senderId: z.string().min(1),
  senderAddress: z.string().email(),
  startTime: z.string().datetime(),
  delayMs: z.number().int().nonnegative(),
  hourlyLimit: z.number().int().positive(),
});

router.post('/schedule', async (req, res) => {
  try {
    const parsed = scheduleSchema.safeParse(req.body);

    if (!parsed.success) {
      console.log('Validation failed:', parsed.error.flatten());
      return res.status(400).json({
        message: 'Invalid scheduling request',
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    const result = await scheduleEmails({
      ...data,
      startTime: new Date(data.startTime),
    });

    return res.status(201).json({
      message: 'Emails scheduled successfully',
      batch: {
        id: result.batch.id,
        totalEmails: result.batch.totalEmails,
        startTime: result.batch.startTime,
      },
      emails: result.emails.map((email) => ({
        id: email.id,
        recipient: email.recipient,
        scheduledAt: email.scheduledAt,
        status: email.status,
      })),
    });
  } catch (error) {
    console.error('Schedule email error:', error);

    return res.status(500).json({
      message: 'Failed to schedule emails',
    });
  }
});

router.get('/scheduled', async (req, res) => {
  try {
    const userId = String(req.query.userId ?? '');

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const emails = await prisma.email.findMany({
      where: {
        userId,
        status: 'SCHEDULED',
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return res.json({
      emails,
    });
  } catch (error) {
    console.error('Get scheduled emails error:', error);

    return res.status(500).json({
      message: 'Failed to fetch scheduled emails',
    });
  }
});

router.get('/sent', async (req, res) => {
  try {
    const userId = String(req.query.userId ?? '');

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const emails = await prisma.email.findMany({
      where: {
        userId,
        status: {
          in: ['SENT', 'FAILED'],
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return res.json({
      emails,
    });
  } catch (error) {
    console.error('Get sent emails error:', error);

    return res.status(500).json({
      message: 'Failed to fetch sent emails',
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const userId = String(req.query.userId ?? '');
    const query = String(req.query.q ?? req.query.query ?? '');

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    if (!query) {
      return res.status(400).json({
        message: 'Search query (q) is required',
      });
    }

    const results = await searchEmails(userId, query);

    return res.json({
      results,
    });
  } catch (error) {
    console.error('Search emails error:', error);

    return res.status(500).json({
      message: 'Failed to search emails',
    });
  }
});

export default router;