import { Router } from 'express';

import {
  createSlackAuthorizationUrl,
  disconnectSlack,
  getSlackConnection,
  handleSlackCallback,
} from '../services/slack.service.js';

import { env } from '../config/env.js';


const router = Router();

router.get('/connect', async (req, res) => {
  try {
    const userId = String(
      req.query.userId ?? '',
    );

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const authorizationUrl =
      await createSlackAuthorizationUrl(userId);

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error(
      'Slack connect error:',
      error,
    );

    return res.status(500).json({
      message: 'Failed to start Slack OAuth',
    });
  }
});
router.get('/callback', async (req, res) => {
  try {
    const code = String(req.query.code ?? '');
    const state = String(req.query.state ?? '');
    const error = String(req.query.error ?? '');

    if (error || !code || !state) {
      return res.redirect(`${env.FRONTEND_URL}?slack=error`);
    }

    await handleSlackCallback(code, state);

    // --- REPLACED SUCCESS RESPONSE WITH REDIRECT ---
    return res.redirect(`${env.FRONTEND_URL}?slack=connected`);
  } catch (error) {
    console.error('Slack callback error:', error);

    // --- REPLACED ERROR RESPONSE WITH REDIRECT ---
    return res.redirect(`${env.FRONTEND_URL}?slack=error`);
  }
});

router.get('/status', async (req, res) => {
  try {
    const userId = String(
      req.query.userId ?? '',
    );

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const connection =
      await getSlackConnection(userId);

    return res.json({
      connected: Boolean(connection),
      connection,
    });
  } catch (error) {
    console.error(
      'Slack status error:',
      error,
    );

    return res.status(500).json({
      message: 'Failed to get Slack status',
    });
  }
});

router.delete('/disconnect', async (req, res) => {
  try {
    const userId = String(
      req.query.userId ?? '',
    );

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    await disconnectSlack(userId);

    return res.json({
      connected: false,
      message: 'Slack disconnected',
    });
  } catch (error) {
    console.error(
      'Slack disconnect error:',
      error,
    );

    return res.status(500).json({
      message: 'Failed to disconnect Slack',
    });
  }
});

export default router;