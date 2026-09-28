export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
}

export type EmailStatus =
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED';

export interface EmailRecord {
  id: string;
  recipient: string;
  subject: string;
  body?: string;
  senderId?: string;
  senderAddress?: string;
  scheduledAt: string;
  sentAt: string | null;
  failedAt?: string | null;
  status: EmailStatus;
  attempts?: number;
  lastError?: string | null;
  createdAt?: string;
}

export interface ScheduleEmailPayload {
  userId: string;
  subject: string;
  body: string;
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
  senderId: string;
  senderAddress: string;
  recipients: string[];
}