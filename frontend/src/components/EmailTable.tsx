import type { EmailRecord } from '../types';

interface EmailTableProps {
  emails: EmailRecord[];
  type: 'scheduled' | 'sent';
  loading: boolean;
}

export function EmailTable({ emails, type, loading }: EmailTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading emails...
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="font-semibold text-slate-900">
          No {type} emails
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Your {type} emails will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-4 font-semibold text-slate-600">Email</th>
              <th className="px-5 py-4 font-semibold text-slate-600">Subject</th>
              <th className="px-5 py-4 font-semibold text-slate-600">
                {type === 'scheduled' ? 'Scheduled Time' : 'Sent Time'}
              </th>
              <th className="px-5 py-4 font-semibold text-slate-600">Status</th>
            </tr>
          </thead>

          <tbody>
            {emails.map((email) => {
              const date =
                type === 'scheduled'
                  ? email.scheduledAt
                  : email.sentAt;

              return (
                <tr key={email.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-4 text-slate-700">
                    {email.recipient}
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-900">
                    {email.subject}
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {date ? new Date(date).toLocaleString() : '—'}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {email.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}