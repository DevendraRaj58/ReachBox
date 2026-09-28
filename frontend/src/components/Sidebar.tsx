import {
  CalendarClock,
  ChevronDown,
  LogOut,
  Mail,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import type { User } from '../types';
import { getSlackConnectUrl, disconnectSlack } from '../lib/api';
import { useEffect, useState } from 'react';
import { getSlackStatus } from '../lib/api';

interface SidebarProps {
  user: User;
  activeView: 'scheduled' | 'sent' | 'compose';
  scheduledCount: number;
  sentCount: number;
  onNavigate: (
    view: 'scheduled' | 'sent' | 'compose',
  ) => void;
  onLogout: () => Promise<void>;
}

export function Sidebar({
  user,
  activeView,
  scheduledCount,
  sentCount,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const [slackConnected, setSlackConnected] = useState(false);

  useEffect(() => {
    getSlackStatus(user.id)
      .then((response) => setSlackConnected(response.connected))
      .catch(() => setSlackConnected(false));
  }, [user.id]);

  async function toggleSlack() {
    if (slackConnected) {
      await disconnectSlack(user.id);
      setSlackConnected(false);
      return;
    }

    window.location.href = getSlackConnectUrl(user.id);
  }

  return (
    <aside className="flex h-screen w-[270px] shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5">
      <div className="mb-7 px-2">
        <div className="text-[29px] font-black tracking-[-0.09em] text-black">
          OUTBOX
        </div>
      </div>

      <div className="mb-5 rounded-xl px-2 py-2">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.name}
            </p>

            <p className="truncate text-xs text-slate-400">
              {user.email}
            </p>
          </div>

          <ChevronDown size={17} className="text-slate-400" />
        </div>
      </div>

      <button
        onClick={() => onNavigate('compose')}
        className="mb-7 flex h-11 items-center justify-center gap-2 rounded-full border-2 border-[#00a62d] text-sm font-semibold text-[#00a62d] transition hover:bg-green-50"
      >
        <Mail size={17} />
        Compose
      </button>

      <div className="mb-3 px-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        Core
      </div>

      <nav className="space-y-1">
        <button
          onClick={() => onNavigate('scheduled')}
          className={`flex h-11 w-full items-center rounded-xl px-3 ${
            activeView === 'scheduled'
              ? 'bg-[#effaf4] text-slate-900'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CalendarClock size={17} className="mr-3" />
          <span className="flex-1 text-left text-sm font-medium">
            Scheduled
          </span>
          <span className="text-xs text-slate-500">
            {scheduledCount}
          </span>
        </button>

        <button
          onClick={() => onNavigate('sent')}
          className={`flex h-11 w-full items-center rounded-xl px-3 ${
            activeView === 'sent'
              ? 'bg-[#effaf4] text-slate-900'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Send size={17} className="mr-3" />
          <span className="flex-1 text-left text-sm font-medium">
            Sent
          </span>
          <span className="text-xs text-slate-500">
            {sentCount}
          </span>
        </button>
      </nav>

      <div className="mt-auto space-y-2">
        <button
          onClick={toggleSlack}
          className="flex w-full items-center rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"
        >
          <span
            className={`mr-3 h-2.5 w-2.5 rounded-full ${
              slackConnected ? 'bg-green-500' : 'bg-slate-300'
            }`}
          />

          <span className="flex-1 text-sm text-slate-600">
            Slack
          </span>

          <span className="text-xs text-slate-400">
            {slackConnected ? 'Connected' : 'Connect'}
          </span>
        </button>

        <a
          href="http://localhost:4000/admin/queues"
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-slate-500 hover:bg-slate-50"
        >
          <SlidersHorizontal size={16} className="mr-3" />
          Queue Monitor
        </a>

        <button
          onClick={onLogout}
          className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-slate-500 hover:bg-slate-50"
        >
          <LogOut size={16} className="mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}