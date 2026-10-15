/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { signInDealer, resetPassword, authErrorMessage } from '../services/authService';

interface DealerAuthScreenProps {
  onBackToHome: () => void;
  onCreateAccount: () => void;
}

/** Dealer sign-in (email + password only). New dealers go through the onboarding form. */
export default function DealerAuthScreen({ onBackToHome, onCreateAccount }: DealerAuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setInfo('If an account exists for that email, a reset link is on its way.');
      } else {
        await signInDealer(email, password); // App picks up the new session via its auth listener
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
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
          <h1 className="text-lg font-extrabold text-white">{mode === 'reset' ? 'Reset your password' : 'Dealer sign in'}</h1>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            {mode === 'reset'
              ? "Enter your email and we'll send you a reset link."
              : 'Sign in to manage your submissions and offers.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required autoComplete="email" className={inputCls} />
            {mode === 'signin' && (
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required autoComplete="current-password" className={inputCls} />
            )}

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
            {info && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">{info}</p>}

            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'reset' ? 'Send reset link' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-xs text-slate-400 flex items-center justify-between">
            {mode === 'signin' ? (
              <>
                <button onClick={() => { setMode('reset'); setError(null); }} className="hover:text-white">Forgot password?</button>
                <button onClick={onCreateAccount} className="text-blue-400 hover:text-blue-300 font-semibold">Create dealer account</button>
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
