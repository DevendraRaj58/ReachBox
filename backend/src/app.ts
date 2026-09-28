import express from 'express';
import cors from 'cors';
import emailRoutes from './routes/email.routes.js';
import slackRoutes from './routes/slack.routes.js';










import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';

import {
  bullBoardAuth,
  serverAdapter,
} from './services/bull-board.service.js';




export const app = express();





app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json({ limit: '2mb' }));


app.use(cookieParser());




app.get('/', (_req, res) => {
  res.json({
    message: 'ReachInbox API is running',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'reachinbox-api',
  });
});


app.use(
  '/admin/queues',
  bullBoardAuth,
  serverAdapter.getRouter(),
);
app.use('/api/emails', emailRoutes);

app.use('/api/auth', authRoutes);


app.use('/api/slack', slackRoutes);


app.use(
  '/admin/queues',
  bullBoardAuth,
  serverAdapter.getRouter(),
);