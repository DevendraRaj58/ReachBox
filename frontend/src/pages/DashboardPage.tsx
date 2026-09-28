import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from 'react';


import {
    Filter,
    RefreshCw,
    Search,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { EmailList } from '../components/EmailList';
import { EmailDetail } from '../components/EmailDetail';
import { ComposeEmail } from '../components/ComposeEmail';
import { EmailDetails } from '../components/EmailDetails';
import {
    getScheduledEmails,
    getSentEmails,
    logout,
    searchEmails,
} from '../lib/api';
import type { EmailRecord, User } from '../types';

interface DashboardPageProps {
    user: User;
    onLogout: () => Promise<void>;
}

type View = 'scheduled' | 'sent' | 'compose';

export function DashboardPage({
    user,
    onLogout,
}: DashboardPageProps) {
    const [activeView, setActiveView] =
        useState<View>('scheduled');

    const [scheduled, setScheduled] =
        useState<EmailRecord[]>([]);

    const [sent, setSent] =
        useState<EmailRecord[]>([]);

    const [loading, setLoading] = useState(true);

    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] =
        useState<EmailRecord[] | null>(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
const [showFilters, setShowFilters] = useState(false);
    const [selectedEmail, setSelectedEmail] =
        useState<EmailRecord | null>(null);

    const loadEmails = useCallback(async () => {
        try {
            setLoading(true);

            const [scheduledResponse, sentResponse] =
                await Promise.all([
                    getScheduledEmails(user.id),
                    getSentEmails(user.id),
                ]);

            setScheduled(scheduledResponse.emails);
            setSent(sentResponse.emails);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        loadEmails();
    }, [loadEmails]);

    const visibleEmails = useMemo(() => {
  const base =
    searchResults ??
    (activeView === 'scheduled' ? scheduled : sent);

  let filtered = base;

  if (searchResults) {
  return filtered;
}

if (activeView === 'scheduled') {
    filtered = filtered.filter(
      (email) =>
        email.status === 'SCHEDULED' ||
        email.status === 'PROCESSING',
    );
  } else {
    filtered = filtered.filter(
      (email) =>
        email.status === 'SENT' ||
        email.status === 'FAILED',
    );
  }

  if (statusFilter !== 'ALL') {
    filtered = filtered.filter(
      (email) => email.status === statusFilter,
    );
  }

  return filtered;
}, [
  activeView,
  scheduled,
  sent,
  searchResults,
  statusFilter,
]);

    async function handleSearch(event: FormEvent) {
        event.preventDefault();

        const value = query.trim();

        if (!value) {
            setSearchResults(null);
            return;
        }

        try {
            setSearching(true);

            const response = await searchEmails(
                user.id,
                value,
            );

            setSearchResults(response.emails);
        } catch (error) {
            console.error(error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }

    function navigate(view: View) {
        setActiveView(view);
        setSelectedEmail(null);
        setQuery('');
        setSearchResults(null);
        setStatusFilter('ALL');
setShowFilters(false);
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <Sidebar
                user={user}
                activeView={activeView}
                scheduledCount={scheduled.length}
                sentCount={sent.length}
                onNavigate={navigate}
                onLogout={onLogout}
            />

            <main className="min-w-0 flex-1 overflow-y-auto">
                {selectedEmail ? (
                    <EmailDetail
                        email={selectedEmail}
                        user={user}
                        onBack={() => setSelectedEmail(null)}
                    />
                ) : activeView === 'compose' ? (
                    <ComposeEmail
                        userId={user.id}
                        onScheduled={async () => {
                            await loadEmails();
                            setActiveView('scheduled');
                        }}
                    />
                ) : (
                    <div className="min-h-full">
                        <div className="flex items-center gap-4 border-b border-slate-100 px-7 py-4">
                            <form
                                onSubmit={handleSearch}
                                className="flex flex-1 items-center"
                            >
                                <Search
                                    size={18}
                                    className="mr-3 text-slate-400"
                                />

                                <input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search"
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                                />
                            </form>

                            <div className="relative">
  <button
    onClick={() => setShowFilters((current) => !current)}
    className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
  >
    <Filter size={18} />
  </button>

  {showFilters && (
    <div className="absolute right-0 top-11 z-30 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
      <button
        onClick={() => {
          setStatusFilter('ALL');
          setShowFilters(false);
        }}
        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
      >
        All
      </button>

      {activeView === 'scheduled' ? (
        <>
          <button
            onClick={() => {
              setStatusFilter('SCHEDULED');
              setShowFilters(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
          >
            Scheduled
          </button>

          <button
            onClick={() => {
              setStatusFilter('PROCESSING');
              setShowFilters(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
          >
            Processing
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => {
              setStatusFilter('SENT');
              setShowFilters(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
          >
            Sent
          </button>

          <button
            onClick={() => {
              setStatusFilter('FAILED');
              setShowFilters(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
          >
            Failed
          </button>
        </>
      )}
    </div>
  )}
</div>

                            <button
                                onClick={loadEmails}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
                                title="Refresh"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        {searchResults && (
                            <div className="flex items-center justify-between border-b border-slate-100 px-7 py-3">
                                <p className="text-xs text-slate-400">
                                    {visibleEmails.length} matching result
                                    {visibleEmails.length !== 1 ? 's' : ''}
                                </p>

                                <button
                                    onClick={() => {
                                        setQuery('');
                                        setSearchResults(null);
                                    }}
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}

                        <EmailList
                            emails={visibleEmails}
                            type={activeView}
                            loading={loading || searching}
                            onOpen={(email) => setSelectedEmail(email)}
                        />


                        <EmailDetails
                            email={selectedEmail}
                            onClose={() => setSelectedEmail(null)}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}