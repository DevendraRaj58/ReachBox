import { useEffect, useState } from 'react';
import {
  disconnectSlack,
  getSlackConnectUrl,
  getSlackStatus,
} from '../lib/api';

interface SlackConnectProps {
  userId: string;
}

export function SlackConnect({ userId }: SlackConnectProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  async function loadStatus() {
    try {
      setLoading(true);

      const response = await getSlackStatus(userId);
      setConnected(response.connected);
    } catch (error) {
      console.error('Failed to load Slack status:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, [userId]);

  function handleConnect() {
    window.location.href = getSlackConnectUrl(userId);
  }

  async function handleDisconnect() {
    try {
      setDisconnecting(true);
      await disconnectSlack(userId);
      setConnected(false);
    } catch (error) {
      console.error('Failed to disconnect Slack:', error);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-semibold text-slate-900">
            Slack Notifications
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Get notified when an hourly email limit is reached.
          </p>
        </div>

        {loading ? (
          <span className="text-sm text-slate-400">
            Checking...
          </span>
        ) : connected ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
              Connected
            </span>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="rounded-lg bg-[#4A154B] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Connect Slack
          </button>
        )}
      </div>
    </div>
  );
}