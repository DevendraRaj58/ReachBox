import type { NextFunction, Request, Response } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from '../queues/email.queue.js';
import { env } from '../config/env.js';

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

export function bullBoardAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
    return res.status(401).send('Authentication required');
  }

  const encoded = authorization.slice('Basic '.length);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');

  const [username, password] = decoded.split(':');

  if (
    username !== env.BULL_BOARD_USER ||
    password !== env.BULL_BOARD_PASSWORD
  ) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
    return res.status(401).send('Invalid credentials');
  }

  next();
}

export { serverAdapter };