import { X } from 'lucide-react';
import type { EmailRecord } from '../types';

interface EmailDetailsProps {
  email: EmailRecord | null;
  onClose: () => void;
}

export function EmailDetails({ email, onClose }: EmailDetailsProps) {
  if (!email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Email Details
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {email.status}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-5 px-6 py-6">
          <div>
            <p className="text-xs font-medium text-slate-400">To</p>
            <p className="mt-1 text-sm text-slate-800">
              {email.recipient}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400">Subject</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {email.subject}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400">Message</p>
            <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {email.body}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Scheduled At
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {new Date(email.scheduledAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Sent At
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {email.sentAt
                  ? new Date(email.sentAt).toLocaleString()
                  : 'Not sent yet'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Sender
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {email.senderAddress}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Attempts
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {email.attempts}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}