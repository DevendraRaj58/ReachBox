import nodemailer, { type Transporter } from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';
import { getSender } from '../config/senders.js';

const transports = new Map<string, Transporter>();

function getTransport(senderId: string) {
  const existingTransport = transports.get(senderId);

  if (existingTransport) {
    return existingTransport;
  }

  const sender = getSender(senderId);

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: sender.user,
      pass: sender.pass,
    },
  });

  transports.set(senderId, transporter);

  return transporter;
}

export async function sendEmail({
  senderId,
  recipient,
  subject,
  body,
  emailId,
}: {
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  emailId: string;
}): Promise<SentMessageInfo> {
  const sender = getSender(senderId);
  const transporter = getTransport(senderId);

  const info = await transporter.sendMail({
    from: `"${sender.name}" <${sender.address}>`,
    to: recipient,
    subject,
    text: body,

    // Stable message ID gives us a consistent identity for this
    // application email when inspecting SMTP messages.
    messageId: `<${emailId}@reachinbox.local>`,
  });

  return info;
}