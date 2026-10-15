/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, Store } from 'lucide-react';
import { listMySubmissions, MySubmission } from '../services/dealerSubmissionService';
import { useMoney } from '../CurrencyContext';
import CurrencySelect from './CurrencySelect';

interface CustomerAccountProps {
  uid: string;
  name: string;
  email: string;
  onBack: () => void;
  onSignOut: () => void;
  onTrack: (s: MySubmission) => void;
  onOpenShop: (shopSlug: string) => void;
}

const STATUS_STYLE: Record<string, string> = {
  New: 'bg-slate-700 text-slate-200',
  Review: 'bg-amber-500/20 text-amber-300',
  'Offer Sent': 'bg-blue-500/20 text-blue-300',
  Accepted: 'bg-emerald-500/20 text-emerald-300',
  Completed: 'bg-emerald-500/20 text-emerald-300',
  Declined: 'bg-slate-700 text-slate-300',
};

export default function CustomerAccount({ uid, name, email, onBack, onSignOut, onTrack, onOpenShop }: CustomerAccountProps) {
  const { offerText } = useMoney();
  const [items, setItems] = useState<MySubmission[] | null>(null);

  useEffect(() => {
    let live = true;
    listMySubmissions(uid).then((l) => live && setItems(l));
    return () => {
      live = false;
    };
  }, [uid]);

  // Group by shop, keeping newest-first order within each
  const byShop = new Map<string, MySubmission[]>();
  (items || []).forEach((s) => byShop.set(s.dealerId, [...(byShop.get(s.dealerId) || []), s]));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="sticky top-0 z-30 bg-[#070d1e] border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <CurrencySelect />
          <button onClick={onSignOut} className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700">
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-black text-white">My submissions</h1>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          {name || email} · every collection you have sent to a shop through TCGBuyer.
        </p>

        {items === null && <p className="text-sm text-slate-400">Loading…</p>}

        {items !== null && items.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 text-center">
            <p className="text-sm text-slate-300">You haven't submitted anything with this account yet.</p>
            <p className="text-xs text-slate-500 mt-1">Open a shop's buying link, sign in, and your submissions will appear here.</p>
          </div>
        )}

        <div className="space-y-6">
          {[...byShop.entries()].map(([dealerId, subs]) => (
            <section key={dealerId}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <Store className="w-4 h-4 text-slate-500" />
                  {subs[0].shopName}
                </h2>
                {subs[0].shopSlug && (
                  <button onClick={() => onOpenShop(subs[0].shopSlug)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
                    Open shop page
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {subs.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onTrack(s)}
                    className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-600 p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-white">{s.ref}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {s.cards} {s.cards === 1 ? 'card' : 'cards'} · {s.date}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLE[s.status] || STATUS_STYLE.New}`}>
                        {s.status === 'Offer Sent' ? 'Offer ready' : s.status}
                      </span>
                      <p className="text-xs text-slate-300 mt-1">{offerText(s)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
