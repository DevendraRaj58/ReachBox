import { randomUUID } from 'node:crypto';

import { prisma } from '../db/prisma.js';
import { redisConnection } from '../queues/redis.js';
import { env } from '../config/env.js';

const SLACK_AUTHORIZE_URL =
  'https://slack.com/oauth/v2/authorize';

const SLACK_TOKEN_URL =
  'https://slack.com/api/oauth.v2.access';

const OAUTH_STATE_TTL_SECONDS = 10 * 60;

interface SlackOAuthResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  authed_user?: {
    id?: string;
  };
  incoming_webhook?: {
    url?: string;
    channel?: string;
    channel_id?: string;
  };
}

export async function createSlackAuthorizationUrl(
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (
    !env.SLACK_CLIENT_ID ||
    !env.SLACK_CLIENT_SECRET ||
    !env.SLACK_REDIRECT_URI
  ) {
    throw new Error('Slack OAuth is not configured');
  }

  const state = randomUUID();

  await redisConnection.set(
    `slack:oauth-state:${state}`,
    userId,
    'EX',
    OAUTH_STATE_TTL_SECONDS,
  );

  const url = new URL(SLACK_AUTHORIZE_URL);

  url.searchParams.set(
    'client_id',
    env.SLACK_CLIENT_ID,
  );

  url.searchParams.set(
    'scope',
    'incoming-webhook',
  );

  url.searchParams.set(
    'redirect_uri',
    env.SLACK_REDIRECT_URI,
  );

  url.searchParams.set('state', state);

  return url.toString();
}

export async function handleSlackCallback(
  code: string,
  state: string,
) {
  const stateKey = `slack:oauth-state:${state}`;

  const userId = await redisConnection.get(stateKey);

  if (!userId) {
    throw new Error('Invalid or expired Slack OAuth state');
  }

  await redisConnection.del(stateKey);

  if (
    !env.SLACK_CLIENT_ID ||
    !env.SLACK_CLIENT_SECRET ||
    !env.SLACK_REDIRECT_URI
  ) {
    throw new Error('Slack OAuth is not configured');
  }

  const body = new URLSearchParams();

  body.set('client_id', env.SLACK_CLIENT_ID);
  body.set(
    'client_secret',
    env.SLACK_CLIENT_SECRET,
  );
  body.set('code', code);
  body.set(
    'redirect_uri',
    env.SLACK_REDIRECT_URI,
  );

  const response = await fetch(
    SLACK_TOKEN_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      body,
    },
  );

  const data =
    (await response.json()) as SlackOAuthResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error ??
        'Slack OAuth token exchange failed',
    );
  }

  const accessToken = data.access_token;
  const webhookUrl =
    data.incoming_webhook?.url;

  if (!accessToken) {
    throw new Error(
      'Slack OAuth response did not contain an access token',
    );
  }

  if (!webhookUrl) {
    throw new Error(
      'Slack OAuth response did not contain an incoming webhook',
    );
  }

  await prisma.slackConnection.upsert({
    where: {
      userId,
    },
    update: {
      slackUserId:
        data.authed_user?.id ?? null,
      accessToken,
      webhookUrl,
      connectedAt: new Date(),
    },
    create: {
      userId,
      slackUserId:
        data.authed_user?.id ?? null,
      accessToken,
      webhookUrl,
    },
  });

  return userId;
}

export async function getSlackConnection(
  userId: string,
) {
  return prisma.slackConnection.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      slackUserId: true,
      webhookUrl: true,
      connectedAt: true,
      updatedAt: true,
    },
  });
}

export async function disconnectSlack(
  userId: string,
) {
  await prisma.slackConnection.deleteMany({
    where: {
      userId,
    },
  });
}

interface NotifyHourlyLimitInput {
  userId: string;
  senderId: string;
  hourlyLimit: number;
  nextAllowedAt: number;
}

export async function notifyHourlyLimitReached(
  input: NotifyHourlyLimitInput,
) {
  const connection =
    await prisma.slackConnection.findUnique({
      where: {
        userId: input.userId,
      },
    });

  if (!connection?.webhookUrl) {
    return false;
  }

  const windowKey = Math.floor(
    Date.now() / (60 * 60 * 1000),
  );

  const notificationKey =
    `slack:limit-alert:${input.userId}:` +
    `${input.senderId}:${windowKey}`;

  const lock = await redisConnection.set(
    notificationKey,
    '1',
    'EX',
    60 * 60,
    'NX',
  );

  if (lock !== 'OK') {
    return false;
  }

  const nextAllowedAt =
    new Date(input.nextAllowedAt).toLocaleString();

  const message =
    `ReachInbox hourly email limit reached.\n` +
    `Sender: ${input.senderId}\n` +
    `Hourly limit: ${input.hourlyLimit}\n` +
    `Queued emails will be rescheduled.\n` +
    `Next available time: ${nextAllowedAt}`;

  try {
    const response = await fetch(
      connection.webhookUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Slack webhook returned ${response.status}`,
      );
    }

    console.log(
      `Slack notification sent for ${input.senderId}`,
    );

    return true;
  } catch (error) {
    await redisConnection.del(notificationKey);

    console.error(
      'Slack notification failed:',
      error,
    );

    return false;
  }
}