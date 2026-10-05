import React, { useState } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { checkLoginAuthorizationStatus } from '../../data/cucomAccounts';
import { 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  Sun, 
  Moon, 
  ShieldCheck,
  Loader2 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, deadlineFormatted, theme, toggleTheme } = useCUCOM();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your institutional username or email.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    // Check if entered user is operational support staff
    const authStatus = checkLoginAuthorizationStatus(username);
    if (authStatus.isExcludedSupportStaff && authStatus.message) {
      setError(authStatus.message);
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.message || 'Invalid username or password. Please verify your credentials or contact IT administration.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-red-50/30 dark:from-[#0B0F19] dark:via-[#0F172A] dark:to-red-950/20 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 font-sans relative transition-colors duration-200">
      {/* Floating Theme Toggle in Corner */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-md backdrop-blur-md hover:border-red-500 dark:hover:border-red-500 transition-all cursor-pointer text-xs font-bold"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-red-600 fill-red-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* University Header / Official Institutional Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="bg-white p-3.5 rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200/80 flex items-center justify-center max-w-[280px]">
              <img 
                src="/cucom-logo.png" 
                alt="Commonwealth University College of Medicine (CUCOM)" 
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-wide uppercase text-slate-900 dark:text-white">
              Commonwealth University College of Medicine
            </h1>
            <p className="text-xs text-red-700 dark:text-red-400 font-bold max-w-sm mx-auto mt-0.5 uppercase tracking-wider">
              Daily Reporting System & Management Portal
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-[11px] font-semibold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Daily Reporting Due by {deadlineFormatted}</span>
          </div>
        </div>

        {/* Main Login Card with Rounded Borders */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xl shadow-slate-200/70 dark:shadow-black/60 border border-slate-200/90 dark:border-slate-800 overflow-hidden">
          {/* Official CUCOM Crimson Accent Bar */}
          <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-700" />

          {/* Card Top Title Banner */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/60">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Institutional Sign-In
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Enter your authorized university credentials</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Secure Access</span>
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Standard Credentials Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>Username or Institutional Email</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-900/60 focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:outline-none transition shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span>Password</span>
                  </label>
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-900/60 focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:outline-none transition shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer active:scale-[0.99] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in with Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Institutional Footer */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <img src="/cucom-crest.png" alt="CUCOM Crest" className="h-4 w-auto object-contain" />
            <span>Commonwealth University College of Medicine • Reporting Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
