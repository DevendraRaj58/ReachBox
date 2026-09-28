import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { emailQueue } from '../queues/email.queue.js';
import { env } from './env.js';

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
  ],
  serverAdapter,
});

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function bullBoardAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Basic ')) {
    res.setHeader(
      'WWW-Authenticate',
      'Basic realm="Bull Board"',
    );

    return res.status(401).send('Authentication required');
  }

  const encodedCredentials = authorization.slice(6);

  let credentials: string;

  try {
    credentials = Buffer.from(
      encodedCredentials,
      'base64',
    ).toString('utf8');
  } catch {
    return res.status(401).send('Invalid authentication');
  }

  const expectedCredentials =
    `${env.BULL_BOARD_USER}:${env.BULL_BOARD_PASSWORD}`;

  if (!safeEqual(credentials, expectedCredentials)) {
    res.setHeader(
      'WWW-Authenticate',
      'Basic realm="Bull Board"',
    );

    return res.status(401).send('Invalid credentials');
  }

  next();
}

export const bullBoardRouter =
  serverAdapter.getRouter();