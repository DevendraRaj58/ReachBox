import { env } from './env.js';

export interface EmailSender {
  id: string;
  name: string;
  address: string;
  user: string;
  pass: string;
}

let senders: EmailSender[];

try {
  senders = JSON.parse(env.ETHEREAL_SENDERS_JSON);
} catch {
  throw new Error('ETHEREAL_SENDERS_JSON is not valid JSON');
}

if (!Array.isArray(senders) || senders.length === 0) {
  throw new Error('At least one email sender must be configured');
}

export function getSender(senderId: string): EmailSender {
  const sender = senders.find((item) => item.id === senderId);

  if (!sender) {
    throw new Error(`Email sender "${senderId}" was not found`);
  }

  return sender;
}