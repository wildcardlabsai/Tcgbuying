/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { IS_LOCAL } from '../config';
import {
  signUpDealer,
  signInDealer,
  signInDealerWithGoogle,
  resetPassword,
  authErrorMessage,
} from '../services/authService';

interface DealerAuthScreenProps {
  onBackToHome: () => void;
}

type Mode = 'signin' | 'signup' | 'reset';

export default function DealerAuthScreen({ onBackToHome }: DealerAuthScreenProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Successful sign-in/up is picked up by the onAuthStateChanged listener in App.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reset') {
      run(async () => {
        await resetPassword(email);
        setInfo('If an account exists for that email, a reset link is on its way.');
      });
    } else if (mode === 'signup') {
      if (!shopName.trim()) {
        setError('Please enter your shop name.');
        return;
      }
      run(() => signUpDealer(shopName, email, password));
    } else {
      run(() => signInDealer(email, password));
    }
  };

  const inputCls =
    'w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between">
        <Logo size="sm" variant="light" />
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Website Home
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm bg-[#0b1329] border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {IS_LOCAL && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
              Demo mode: accounts and submissions are stored only in this browser.
            </p>
          )}
          <h1 className="text-lg font-extrabold text-white">
            {mode === 'signup' ? 'Create your dealer account' : mode === 'reset' ? 'Reset your password' : 'Dealer sign in'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            {mode === 'signup'
              ? 'Set up your shop and get your own customer buying portal.'
              : mode === 'reset'
                ? "Enter your email and we'll send you a reset link."
                : 'Sign in to manage your submissions and offers.'}
          </p>

          {mode !== 'reset' && (
            <>
              <button
                type="button"
                disabled={busy || IS_LOCAL}
                title={IS_LOCAL ? 'Available once Firebase is connected' : undefined}
                onClick={() => run(signInDealerWithGoogle)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
                  <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
                  <path fill="#34A853" d="M24 48c6.3 0 11.8-2.1 15.7-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
                </svg>
                Continue with Google{IS_LOCAL ? ' (coming soon)' : ''}
              </button>
              <div className="flex items-center gap-3 my-4 text-[11px] text-slate-500">
                <div className="h-px flex-1 bg-slate-800" />
                or use email
                <div className="h-px flex-1 bg-slate-800" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Shop name"
                maxLength={100}
                autoComplete="organization"
                className={inputCls}
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoComplete="email"
              className={inputCls}
            />
            {mode !== 'reset' && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className={inputCls}
              />
            )}

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
            {info && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-xs text-slate-400 flex items-center justify-between">
            {mode === 'signin' ? (
              <>
                <button onClick={() => { setMode('reset'); setError(null); }} className="hover:text-white">Forgot password?</button>
                <button onClick={() => { setMode('signup'); setError(null); }} className="text-blue-400 hover:text-blue-300 font-semibold">Create account</button>
              </>
            ) : (
              <button onClick={() => { setMode('signin'); setError(null); setInfo(null); }} className="text-blue-400 hover:text-blue-300 font-semibold">
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
