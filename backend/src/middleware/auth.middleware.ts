import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import { getUserFromToken } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        createdAt: Date;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token =
      req.cookies?.reachinbox_token;

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    const user =
      await getUserFromToken(token);

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired session',
    });
  }
}