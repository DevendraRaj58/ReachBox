import {
  ArrowLeft,
  Archive,
  MoreHorizontal,
  Paperclip,
  Star,
  Trash2,
} from 'lucide-react';
import type { EmailRecord, User } from '../types';

interface EmailDetailProps {
  email: EmailRecord;
  user: User;
  onBack: () => void;
}

export function EmailDetail({
  email,
  user,
  onBack,
}: EmailDetailProps) {
  const displayDate =
    email.sentAt ?? email.scheduledAt;

  return (
    <div className="min-h-full bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft size={21} />
          </button>

          <h1 className="truncate text-xl font-semibold text-slate-900">
            {email.subject || '(No subject)'}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <button className="rounded-lg p-2 hover:bg-slate-50">
            <Star size={18} />
          </button>

          <button className="rounded-lg p-2 hover:bg-slate-50">
            <Archive size={18} />
          </button>

          <button className="rounded-lg p-2 hover:bg-slate-50">
            <Trash2 size={18} />
          </button>

          <button className="rounded-lg p-2 hover:bg-slate-50">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-8 py-9">
        <div className="flex items-start gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {email.senderAddress || user.email}
                </p>

                <p className="text-sm text-slate-400">
                  to {email.recipient}
                </p>
              </div>

              <p className="text-sm text-slate-400">
                {new Date(displayDate).toLocaleString()}
              </p>
            </div>

            <div className="mt-9 whitespace-pre-wrap text-[15px] leading-8 text-slate-800">
              {email.body?.replace(/<[^>]+>/g, '') ||
                'No message body.'}
            </div>

            <div className="mt-10">
              <div className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <Paperclip size={17} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Attachments
                  </p>
                  <p className="text-xs text-slate-400">
                    None
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}