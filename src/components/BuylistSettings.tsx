/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  Storefront,
  PricingSettings,
  DEFAULT_PRICING,
  getStorefront,
  saveStorefront,
  sanitizePricing,
} from '../services/storefrontService';
import { CURRENCIES, CurrencyCode, symbolOf, r2 } from '../services/currency';

interface BuylistSettingsProps {
  dealerId: string;
  portalLink: string;
  onSaved: (s: Storefront) => void;
}

const field =
  'w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500';
const label = 'block text-xs font-semibold text-slate-300 mb-1';

type BulkKey = keyof PricingSettings['bulk'];
const BULK_ROWS: { key: BulkKey; title: string; hint: string; step: string }[] = [
  { key: 'commons', title: 'Commons / uncommons', hint: 'per card', step: '0.001' },
  { key: 'holos', title: 'Holos / reverse holos', hint: 'per card', step: '0.001' },
  { key: 'ultraRares', title: 'Ultra rares / ex / V', hint: 'per card', step: '0.01' },
  { key: 'sealedPacks', title: 'Sealed packs', hint: 'per pack', step: '0.01' },
];

export default function BuylistSettings({ dealerId, portalLink, onSaved }: BuylistSettingsProps) {
  const [store, setStore] = useState<Storefront | null>(null);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    getStorefront(dealerId).then((s) => {
      if (live) {
        setStore(s);
        setPricing(s.pricing);
      }
    });
    return () => {
      live = false;
    };
  }, [dealerId]);

  if (!store) return <p className="text-xs text-slate-400">Loading…</p>;

  const patch = (p: Partial<PricingSettings>) => {
    setPricing((prev) => ({ ...prev, ...p }));
    setStatus('idle');
  };
  const patchBulk = (key: BulkKey, value: string) =>
    patch({ bulk: { ...pricing.bulk, [key]: value === '' ? 0 : Number(value) } });

  const handleSave = async () => {
    setStatus('saving');
    const next = { ...store, pricing: sanitizePricing(pricing) };
    const ok = await saveStorefront(dealerId, next);
    setStatus(ok ? 'saved' : 'error');
    if (ok) {
      setStore(next);
      setPricing(next.pricing);
      onSaved(next);
    }
  };

  const sym = symbolOf(pricing.currency);
  // Worked example, shown in the shop's own currency (rates are 1:1 for display here)
  const example = 100;
  const cash = r2((example * pricing.cashPercent) / 100);
  const credit = r2((example * pricing.creditPercent) / 100);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black text-white">Pricing &amp; Bulk Rates</h2>
        <p className="text-xs text-slate-400 mt-1">
          Choose what share of estimated market value you pay, and flat rates for bulk. Collectors see offers calculated from these.
        </p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-2">
        <label className={label}>Your customer buying portal link</label>
        <div className="flex gap-2">
          <input readOnly value={portalLink} onFocus={(e) => e.currentTarget.select()} className={`${field} flex-1 font-mono`} />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(portalLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Singles: percentage of market value</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="bs-cash">Cash offer (%)</label>
            <input id="bs-cash" type="number" min={1} max={100} step={1} className={field} value={pricing.cashPercent} onChange={(e) => patch({ cashPercent: Number(e.target.value) })} />
            <p className="text-[10px] text-slate-500 mt-1">Typical: 65–75%</p>
          </div>
          <div>
            <label className={label} htmlFor="bs-credit">Store credit offer (%)</label>
            <input id="bs-credit" type="number" min={1} max={150} step={1} className={field} value={pricing.creditPercent} onChange={(e) => patch({ creditPercent: Number(e.target.value) })} />
            <p className="text-[10px] text-slate-500 mt-1">Typical: 80–90%</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
          Example: a card worth {sym}
          {example} is offered at {sym}
          {cash} cash or {sym}
          {credit} store credit.
        </p>
      </section>

      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">Bulk rates (cash)</h3>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400" htmlFor="bs-cur">Shop currency</label>
            <select
              id="bs-cur"
              value={pricing.currency}
              onChange={(e) => patch({ currency: e.target.value as CurrencyCode })}
              className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 -mt-2">
          Amounts below are in {pricing.currency}. Collectors can view them in their own currency; store credit for bulk is scaled by your credit ÷ cash percentage.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {BULK_ROWS.map((row) => (
            <div key={row.key}>
              <label className={label} htmlFor={`bs-${row.key}`}>
                {row.title} ({sym} {row.hint})
              </label>
              <input
                id={`bs-${row.key}`}
                type="number"
                min={0}
                step={row.step}
                className={field}
                value={pricing.bulk[row.key]}
                onChange={(e) => patchBulk(row.key, e.target.value)}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                1,000 cards = {sym}{r2(pricing.bulk[row.key] * 1000).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-bold text-xs text-white"
        >
          {status === 'saving' ? 'Saving…' : 'Save pricing'}
        </button>
        {status === 'saved' && <span className="text-xs text-emerald-400">Saved. New offers use these rates.</span>}
        {status === 'error' && <span className="text-xs text-red-400">Could not save. Please try again.</span>}
      </div>
    </div>
  );
}
