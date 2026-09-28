import type {
  AuthResponse,
  EmailRecord,
  ScheduleEmailPayload,
} from '../types';

const API_BASE_URL = 'http://localhost:4000';

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed');
  }

  return data as T;
}

export async function getCurrentUser<T = AuthResponse>() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: 'include',
  });

  return parseResponse<T>(response);
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return parseResponse<{ message: string }>(response);
}

export function getGoogleLoginUrl() {
  return `${API_BASE_URL}/api/auth/google`;
}

export async function getScheduledEmails(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/emails/scheduled?userId=${encodeURIComponent(userId)}`,
    {
      credentials: 'include',
    },
  );

  return parseResponse<{ emails: EmailRecord[] }>(response);
}

export async function getSentEmails(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/emails/sent?userId=${encodeURIComponent(userId)}`,
    {
      credentials: 'include',
    },
  );

  return parseResponse<{ emails: EmailRecord[] }>(response);
}

export async function searchEmails(userId: string, query: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/emails/search?userId=${encodeURIComponent(
      userId,
    )}&q=${encodeURIComponent(query)}`,
    {
      credentials: 'include',
    },
  );

  const data = await parseResponse<{
    results: Array<
      EmailRecord & {
        emailId: string;
      }
    >;
  }>(response);

  return {
    emails: data.results.map((email) => ({
      ...email,
      id: email.emailId,
    })),
  };
}

export async function scheduleEmails(payload: ScheduleEmailPayload) {
  const response = await fetch(`${API_BASE_URL}/api/emails/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function getSlackStatus(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/slack/status?userId=${encodeURIComponent(userId)}`,
    {
      credentials: 'include',
    },
  );

  return parseResponse<{
    connected: boolean;
    connection: {
      slackUserId: string | null;
      webhookUrl: string | null;
      connectedAt: string;
    } | null;
  }>(response);
}

export function getSlackConnectUrl(userId: string) {
  return `${API_BASE_URL}/api/slack/connect?userId=${encodeURIComponent(userId)}`;
}

export async function disconnectSlack(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/slack/disconnect?userId=${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  return parseResponse<{ message: string }>(response);
}