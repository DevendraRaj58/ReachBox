import { Router } from 'express';

import {
  authenticateWithGoogle,
  createGoogleAuthUrl,
  createSessionToken,
} from '../services/auth.service.js';

import { requireAuth } from '../middleware/auth.middleware.js';

import { env } from '../config/env.js';

const router = Router();

router.get('/google', async (_req, res) => {
  try {
    const url =
      await createGoogleAuthUrl();

    return res.redirect(url);
  } catch (error) {
    console.error(
      'Google OAuth start error:',
      error,
    );

    return res.status(500).json({
      message:
        'Failed to start Google authentication',
    });
  }
});

router.get(
  '/google/callback',
  async (req, res) => {
    try {
      const code = String(
        req.query.code ?? '',
      );

      const state = String(
        req.query.state ?? '',
      );

      if (!code || !state) {
        return res.status(400).json({
          message:
            'Missing Google OAuth parameters',
        });
      }

      const user =
        await authenticateWithGoogle(
          code,
          state,
        );

      const token =
        createSessionToken(user.id);

      res.cookie(
        'reachinbox_token',
        token,
        {
          httpOnly: true,
          sameSite: 'lax',
          secure:
            env.NODE_ENV === 'production',
          maxAge:
            7 * 24 * 60 * 60 * 1000,
        },
      );

      return res.redirect(
        env.FRONTEND_URL,
      );
    } catch (error) {
      console.error(
        'Google OAuth callback error:',
        error,
      );

      return res.status(500).json({
        message:
          'Google authentication failed',
      });
    }
  },
);

router.get(
  '/me',
  requireAuth,
  async (req, res) => {
    return res.json({
      user: req.user,
    });
  },
);

router.post(
  '/logout',
  (_req, res) => {
    res.clearCookie(
      'reachinbox_token',
      {
        httpOnly: true,
        sameSite: 'lax',
        secure:
          env.NODE_ENV === 'production',
      },
    );

    return res.json({
      message: 'Logged out successfully',
    });
  },
);

export default router;