import { Mail, Lock } from 'lucide-react';
import { getGoogleLoginUrl } from '../lib/api';

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5">
      <div className="w-full max-w-[530px] rounded-[18px] border border-slate-100 bg-white px-8 py-10 shadow-[0_10px_45px_rgba(0,0,0,0.06)] sm:px-14">
        <h1 className="mb-10 text-center text-[38px] font-bold tracking-tight text-black">
          Login
        </h1>

        <button
          onClick={() => {
            window.location.href = getGoogleLoginUrl();
          }}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#effcf5] text-[16px] font-medium text-slate-900 transition hover:bg-[#e4faef]"
        >
          <span className="text-[20px] font-bold">G</span>
          Login with Google
        </button>

        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-sm text-slate-400">
            or sign up through email
          </span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Email ID
            </label>

            <div className="flex h-12 items-center rounded-xl border border-slate-100 bg-white px-4">
              <Mail size={17} className="mr-3 text-slate-300" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder=""
                disabled
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Password
            </label>

            <div className="flex h-12 items-center rounded-xl border border-slate-100 bg-white px-4">
              <Lock size={17} className="mr-3 text-slate-300" />
              <input
                type="password"
                className="w-full bg-transparent text-sm outline-none"
                disabled
              />
            </div>
          </div>

          <button
            onClick={() => {
              window.location.href = getGoogleLoginUrl();
            }}
            className="h-13 w-full rounded-xl bg-[#00a62d] text-[16px] font-medium text-white transition hover:bg-[#008f26]"
          >
            Login
          </button>

          <p className="text-center text-xs text-slate-400">
            Continue with Google to authenticate your ReachInbox account.
          </p>
        </div>
      </div>
    </main>
  );
}