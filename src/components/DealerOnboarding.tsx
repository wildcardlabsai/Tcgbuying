/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { signUpDealer, authErrorMessage } from '../services/authService';

interface DealerOnboardingProps {
  onBackToHome: () => void;
  onSignIn: () => void;
  onOpenLegal: (doc: 'terms' | 'privacy') => void;
}

const COUNTRIES: [string, string][] = [
  ['GB', 'United Kingdom'],
  ['IE', 'Ireland'],
  ['US', 'United States'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
  ['NL', 'Netherlands'],
  ['OT', 'Other'],
];
const GAMES = ['Pokémon', 'Magic: The Gathering', 'Yu-Gi-Oh!', 'One Piece', 'Disney Lorcana', 'Sports cards', 'Other'];
const METHODS = ['In store', 'Facebook / Instagram messages', 'eBay / marketplaces', 'Discord / WhatsApp', 'Email / website form', "I don't buy collections yet"];
const VOLUMES = [
  ['new', "Just starting / not sure yet"],
  ['lt1k', 'Under 1,000 a month'],
  ['1k-5k', '1,000 – 5,000 a month'],
  ['5k-20k', '5,000 – 20,000 a month'],
  ['20k+', 'Over 20,000 a month'],
];
const HEARD = ['Search engine', 'Social media', 'Another dealer / friend', 'Event or trade show', 'Other'];

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const input =
  'w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';
const labelCls = 'block text-xs font-semibold text-slate-300 mb-1';

export default function DealerOnboarding({ onBackToHome, onSignIn, onOpenLegal }: DealerOnboardingProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [country, setCountry] = useState('GB');
  const [shopType, setShopType] = useState<'physical' | 'online' | 'both'>('physical');
  const [games, setGames] = useState<string[]>([]);
  const [monthlyVolume, setMonthlyVolume] = useState('new');
  const [currentMethods, setCurrentMethods] = useState<string[]>([]);
  const [website, setWebsite] = useState('');
  const [heardFrom, setHeardFrom] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !ownerName.trim()) return setError('Please enter your shop name and your name.');
    if (games.length === 0) return setError('Choose at least one game you buy.');
    setError(null);
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!agreed) return setError('Please accept the Terms and Privacy Policy to continue.');
    setError(null);
    setBusy(true);
    try {
      await signUpDealer({ shopName, ownerName, email, password, phone, country, shopType, games, monthlyVolume, currentMethods, website, heardFrom });
      // App sees the new session and opens the dashboard.
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
      active ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between">
        <Logo size="sm" variant="light" />
        <button onClick={onBackToHome} className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700">
          <ArrowLeft className="w-3.5 h-3.5" />
          Website Home
        </button>
      </header>

      <main className="flex-1 flex justify-center px-4 pb-16 pt-2">
        <div className="w-full max-w-xl bg-[#0b1329] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl h-fit">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Step {step} of 2</p>
          <h1 className="text-xl font-extrabold text-white mt-1">{step === 1 ? 'Tell us about your shop' : 'Create your login'}</h1>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            {step === 1 ? 'This helps us set up your buying page. It takes about a minute.' : 'You will use these details to sign in to your dealer dashboard.'}
          </p>

          <div className="h-1 rounded-full bg-slate-800 mb-6 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>

          {step === 1 ? (
            <form onSubmit={nextStep} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="ob-shop">Shop / business name *</label>
                  <input id="ob-shop" className={input} value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={100} placeholder="e.g. The Card Vault" autoComplete="organization" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="ob-owner">Your name *</label>
                  <input id="ob-owner" className={input} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} maxLength={100} placeholder="e.g. Alex Henderson" autoComplete="name" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="ob-country">Country *</label>
                  <select id="ob-country" className={input} value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="ob-type">How do you trade? *</label>
                  <select id="ob-type" className={input} value={shopType} onChange={(e) => setShopType(e.target.value as typeof shopType)}>
                    <option value="physical">Physical store</option>
                    <option value="online">Online only</option>
                    <option value="both">Store and online</option>
                  </select>
                </div>
              </div>

              <div>
                <span className={labelCls}>Which games do you buy? *</span>
                <div className="flex flex-wrap gap-2">
                  {GAMES.map((g) => (
                    <button type="button" key={g} aria-pressed={games.includes(g)} onClick={() => setGames(toggle(games, g))} className={chip(games.includes(g))}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="ob-vol">How much do you spend buying collections?</label>
                <select id="ob-vol" className={input} value={monthlyVolume} onChange={(e) => setMonthlyVolume(e.target.value)}>
                  {VOLUMES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className={labelCls}>How do you take in collections today?</span>
                <div className="flex flex-wrap gap-2">
                  {METHODS.map((m) => (
                    <button type="button" key={m} aria-pressed={currentMethods.includes(m)} onClick={() => setCurrentMethods(toggle(currentMethods, m))} className={chip(currentMethods.includes(m))}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="ob-web">Website or social page</label>
                  <input id="ob-web" className={input} value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={200} placeholder="optional" autoComplete="url" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="ob-heard">How did you hear about us?</label>
                  <select id="ob-heard" className={input} value={heardFrom} onChange={(e) => setHeardFrom(e.target.value)}>
                    <option value="">Choose…</option>
                    {HEARD.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

              <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="ob-email">Email address *</label>
                <input id="ob-email" type="email" required className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@yourshop.co.uk" />
              </div>
              <div>
                <label className={labelCls} htmlFor="ob-phone">Phone number</label>
                <input id="ob-phone" type="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} autoComplete="tel" placeholder="optional" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="ob-pw">Password *</label>
                  <input id="ob-pw" type="password" required minLength={8} className={input} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="8+ characters" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="ob-pw2">Confirm password *</label>
                  <input id="ob-pw2" type="password" required className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
                <span>
                  I agree to the{' '}
                  <button type="button" onClick={() => onOpenLegal('terms')} className="text-blue-400 underline">Terms of Service</button> and{' '}
                  <button type="button" onClick={() => onOpenLegal('privacy')} className="text-blue-400 underline">Privacy Policy</button>.
                </span>
              </label>

              {error && <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep(1); setError(null); }} className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200">
                  Back
                </button>
                <button type="submit" disabled={busy} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white disabled:opacity-60">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create my buying page
                </button>
              </div>
            </form>
          )}

          <p className="mt-5 text-xs text-slate-400 text-center">
            Already have an account?{' '}
            <button onClick={onSignIn} className="text-blue-400 hover:text-blue-300 font-semibold">Sign in</button>
          </p>
        </div>
      </main>
    </div>
  );
}
