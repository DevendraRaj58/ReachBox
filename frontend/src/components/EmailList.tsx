import { Star } from 'lucide-react';
import type { EmailRecord } from '../types';

interface EmailListProps {
  emails: EmailRecord[];
  type: 'scheduled' | 'sent';
  loading: boolean;
  onOpen: (email: EmailRecord) => void;
}

function formatScheduledTime(date: string) {
  return new Date(date).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatSentTime(date: string) {
  return new Date(date).toLocaleString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EmailList({
  emails,
  type,
  loading,
  onOpen,
}: EmailListProps) {
  if (loading) {
    return (
      <div className="px-8 py-12 text-sm text-slate-400">
        Loading emails...
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-4xl">✉</div>

          <h3 className="font-semibold text-slate-800">
            No emails found
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {type === 'scheduled'
              ? 'Your scheduled emails will appear here.'
              : 'Your sent emails will appear here.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {emails.map((email) => (
        <button
          key={email.id}
          type="button"
          onClick={() => onOpen(email)}
          className="group flex w-full items-center border-b border-slate-100 px-7 py-4 text-left transition hover:bg-slate-50"
        >
          <div className="w-[220px] shrink-0 pr-5">
            <p className="truncate text-sm font-semibold text-slate-900">
              To: {email.recipient}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              {type === 'scheduled' ? (
                <span className="shrink-0 rounded-full bg-[#fff4d4] px-2.5 py-1 text-[11px] font-semibold text-[#bc7d00]">
                  ◷ {formatScheduledTime(email.scheduledAt)}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-[#f0f7ff] px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                  Sent
                </span>
              )}

              <p className="truncate text-sm font-semibold text-slate-800">
                {email.subject}
              </p>

              {email.body && (
                <>
                  <span className="text-slate-300">-</span>

                  <p className="truncate text-sm text-slate-400">
                    {email.body.replace(/<[^>]*>/g, '')}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="ml-5 flex shrink-0 items-center gap-4">
            {type === 'sent' && email.sentAt && (
              <span className="hidden text-xs text-slate-400 lg:block">
                {formatSentTime(email.sentAt)}
              </span>
            )}

            <Star
              size={18}
              className="text-slate-300"
            />
          </div>
        </button>
      ))}
    </div>
  );
}