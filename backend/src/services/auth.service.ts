import { randomUUID } from 'node:crypto';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { redisConnection } from '../queues/redis.js';

const GOOGLE_OAUTH_STATE_TTL = 10 * 60;

const googleClient = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL,
);

export async function createGoogleAuthUrl() {
    if (
        !env.GOOGLE_CLIENT_ID ||
        !env.GOOGLE_CLIENT_SECRET
    ) {
        throw new Error('Google OAuth is not configured');
    }

    const state = randomUUID();

    await redisConnection.set(
        `google:oauth-state:${state}`,
        '1',
        'EX',
        GOOGLE_OAUTH_STATE_TTL,
    );

    return googleClient.generateAuthUrl({
        access_type: 'online',
        scope: [
            'openid',
            'email',
            'profile',
        ],
        prompt: 'select_account',
        state,
    });
}

export async function authenticateWithGoogle(
    code: string,
    state: string,
) {
    const stateKey =
        `google:oauth-state:${state}`;

    const validState =
        await redisConnection.get(stateKey);

    if (!validState) {
        throw new Error(
            'Invalid or expired Google OAuth state',
        );
    }

    await redisConnection.del(stateKey);

    const { tokens } =
        await googleClient.getToken(code);

    if (!tokens.id_token) {
        throw new Error(
            'Google did not return an ID token',
        );
    }

    const ticket =
        await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: env.GOOGLE_CLIENT_ID,
        });

    const payload = ticket.getPayload();

    if (
        !payload?.sub ||
        !payload.email
    ) {
        throw new Error(
            'Google account information is incomplete',
        );
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name =
        payload.name ??
        email.split('@')[0];

    const avatarUrl =
        payload.picture ?? null;

    let user = await prisma.user.findUnique({
        where: {
            googleId,
        },
    });

    if (user) {
        user = await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                email,
                ...(name !== undefined ? { name } : {}),
                avatarUrl,
            },
        });
    } else {
        const existingEmailUser =
            await prisma.user.findUnique({
                where: {
                    email,
                },
            });

        if (existingEmailUser) {
    user = await prisma.user.update({
        where: {
            id: existingEmailUser.id,
        },
        data: {
            googleId,
            ...(name !== undefined ? { name } : {}),
            avatarUrl,
        },
    });
} else {
    user = await prisma.user.create({
        data: {
            googleId,
            email,
            name: name ?? '',
            avatarUrl,
        },
    });
}
    }

    return user;
}

export function createSessionToken(
    userId: string,
) {
    return jwt.sign(
        {
            sub: userId,
        },
        env.JWT_SECRET,
        {
            expiresIn: '7d',
        },
    );
}

export async function getUserFromToken(
    token: string,
) {
    const payload = jwt.verify(
        token,
        env.JWT_SECRET,
    );

    if (
        typeof payload !== 'object' ||
        !payload.sub
    ) {
        throw new Error('Invalid session token');
    }

    const user =
        await prisma.user.findUnique({
            where: {
                id: String(payload.sub),
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}