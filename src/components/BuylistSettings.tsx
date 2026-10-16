/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Storefront,
  PricingSettings,
  BuylistEntry,
  OfferTemplate,
  MAX_BUYLIST,
  MAX_TEMPLATES,
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
const label_ = label;

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
  const [address, setAddress] = useState('');
  const [qr, setQr] = useState('');
  const [buylist, setBuylist] = useState<BuylistEntry[]>([]);
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [newEntry, setNewEntry] = useState({ name: '', setName: '', cashPrice: '', creditPrice: '' });
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getStorefront(dealerId).then((s) => {
      if (live) {
        setStore(s);
        setPricing(s.pricing);
        setAddress(s.address);
        setBuylist(s.buylist);
        setTemplates(s.offerTemplates);
      }
    });
    return () => {
      live = false;
    };
  }, [dealerId]);

  useEffect(() => {
    QRCode.toDataURL(portalLink, { margin: 2, width: 512 }).then(setQr).catch(() => setQr(''));
  }, [portalLink]);

  if (!store) return <p className="text-xs text-slate-400">Loading…</p>;

  const patch = (p: Partial<PricingSettings>) => {
    setPricing((prev) => ({ ...prev, ...p }));
    setStatus('idle');
  };
  const patchBulk = (key: BulkKey, value: string) =>
    patch({ bulk: { ...pricing.bulk, [key]: value === '' ? 0 : Number(value) } });

  const handleSave = async () => {
    setStatus('saving');
    const next = { ...store, address: address.trim().slice(0, 300), pricing: sanitizePricing(pricing), buylist, offerTemplates: templates };
    const ok = await saveStorefront(dealerId, next);
    setStatus(ok ? 'saved' : 'error');
    if (ok) {
      setStore(next);
      setPricing(next.pricing);
      setBuylist(next.buylist);
      setTemplates(next.offerTemplates);
      onSaved(next);
    }
  };

  const markDirty = () => setStatus('idle');

  const addEntry = () => {
    const cash = Number(newEntry.cashPrice);
    if (!newEntry.name.trim() || !(cash > 0) || buylist.length >= MAX_BUYLIST) return;
    const entry: BuylistEntry = { name: newEntry.name.trim(), cashPrice: cash };
    if (newEntry.setName.trim()) entry.setName = newEntry.setName.trim();
    if (newEntry.creditPrice !== '' && Number(newEntry.creditPrice) > 0) entry.creditPrice = Number(newEntry.creditPrice);
    setBuylist([...buylist, entry]);
    setNewEntry({ name: '', setName: '', cashPrice: '', creditPrice: '' });
    markDirty();
  };

  /** Lines of "Card name, Set (optional), Cash price, Credit price (optional)" */
  const importLines = () => {
    const added: BuylistEntry[] = [];
    let skipped = 0;
    for (const line of importText.split(/\n+/)) {
      if (!line.trim()) continue;
      const cols = line.split(/[,\t|]/).map((c) => c.trim());
      const nums = cols.filter((c) => /^\d+(\.\d+)?$/.test(c)).map(Number);
      const texts = cols.filter((c) => c && !/^\d+(\.\d+)?$/.test(c));
      if (!texts[0] || !(nums[0] > 0)) {
        skipped++;
        continue;
      }
      const e: BuylistEntry = { name: texts[0], cashPrice: nums[0] };
      if (texts[1]) e.setName = texts[1];
      if (nums[1] > 0) e.creditPrice = nums[1];
      added.push(e);
    }
    setBuylist([...buylist, ...added].slice(0, MAX_BUYLIST));
    setImportMsg(`Added ${added.length} card${added.length === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} line${skipped === 1 ? '' : 's'} it could not read` : ''}.`);
    setImportText('');
    markDirty();
  };

  const sym = symbolOf(pricing.currency);
  // Worked example, shown in the shop's own currency (rates are 1:1 for display here)
  const example = 100;
  const cash = r2((example * pricing.cashPercent) / 100);
  const credit = r2((example * pricing.creditPercent) / 100);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black text-white">Shop settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Your public link, where collectors post their cards, and your default pricing. Remember to press Save changes.
        </p>
      </div>

      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">Your public buying page</h3>
        <p className="text-xs text-slate-400">Give this link to collectors, or put the QR code on your counter, flyers and social posts.</p>
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
          <a href={portalLink} target="_blank" rel="noreferrer" className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
            Open
          </a>
        </div>
        {qr && (
          <div className="flex items-center gap-4 pt-1">
            <img src={qr} alt="QR code for your buying page" className="w-28 h-28 rounded-lg bg-white p-1" />
            <a href={qr} download="buying-page-qr.png" className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
              Download QR code
            </a>
          </div>
        )}
      </section>

      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-2">
        <h3 className="text-sm font-bold text-white">Where collectors post their cards</h3>
        <p className="text-xs text-slate-400">
          Shown on the collector's confirmation, their tracking page and the printable packing slip (which carries the submission QR code).
        </p>
        <textarea
          rows={4}
          maxLength={300}
          className={field}
          value={address}
          onChange={(e) => { setAddress(e.target.value); markDirty(); }}
          placeholder={'Your shop name\n1 High Street\nTown, AB1 2CD'}
        />
      </section>

      <div className="pt-1">
        <h3 className="text-sm font-bold text-white">Default pricing</h3>
        <p className="text-xs text-slate-400 mt-1">What share of market value you pay, and flat rates for bulk. Collectors see offers calculated from these.</p>
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
        <div>
          <h3 className="text-sm font-bold text-white">Condition adjustments</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Prices are for Near Mint. Set what share of that price you pay for played cards. Graded slabs are not adjusted automatically: you price those yourself when you review.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['lp', 'Lightly played'],
            ['mp', 'Moderately played'],
            ['hp', 'Heavily played'],
            ['damaged', 'Damaged'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className={label_} htmlFor={`bs-cond-${key}`}>{label} (%)</label>
              <input
                id={`bs-cond-${key}`}
                type="number"
                min={5}
                max={100}
                step={1}
                className={field}
                value={Math.round(pricing.conditions[key] * 100)}
                onChange={(e) => patch({ conditions: { ...pricing.conditions, [key]: Number(e.target.value) / 100 } })}
              />
            </div>
          ))}
        </div>
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

      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Fixed prices for specific cards</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Cards you always want at a set price. These override the percentage for a matching card name (and set, if you add one). Amounts are in {pricing.currency}, for Near Mint; the condition the collector picks adjusts them. Collectors can see this list, so only add prices you are happy to publish.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <input className={`${field} col-span-2`} placeholder="Card name" aria-label="Buylist card name" value={newEntry.name} onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })} />
          <input className={field} placeholder="Set (optional)" aria-label="Buylist set" value={newEntry.setName} onChange={(e) => setNewEntry({ ...newEntry, setName: e.target.value })} />
          <input className={field} type="number" min={0} step="0.01" placeholder={`Cash ${sym}`} aria-label="Buylist cash price" value={newEntry.cashPrice} onChange={(e) => setNewEntry({ ...newEntry, cashPrice: e.target.value })} />
          <input className={field} type="number" min={0} step="0.01" placeholder={`Credit ${sym}`} aria-label="Buylist credit price" value={newEntry.creditPrice} onChange={(e) => setNewEntry({ ...newEntry, creditPrice: e.target.value })} />
        </div>
        <button type="button" onClick={addEntry} className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white">
          Add card
        </button>

        {buylist.length > 0 && (
          <ul className="divide-y divide-slate-800 border border-slate-800 rounded-lg">
            {buylist.map((b, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-200">
                <span className="min-w-0 truncate">
                  <strong className="text-white">{b.name}</strong>
                  {b.setName && <span className="text-slate-400"> · {b.setName}</span>}
                </span>
                <span className="shrink-0 flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold">{sym}{b.cashPrice}{b.creditPrice ? ` / ${sym}${b.creditPrice} credit` : ''}</span>
                  <button type="button" onClick={() => { setBuylist(buylist.filter((_, idx) => idx !== i)); markDirty(); }} className="text-slate-500 hover:text-red-400" aria-label={`Remove ${b.name}`}>
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <details className="text-xs text-slate-400">
          <summary className="cursor-pointer text-slate-300 font-semibold">Paste a list</summary>
          <p className="mt-2">One card per line: <code className="text-slate-300">Name, Set (optional), Cash price, Credit price (optional)</code></p>
          <textarea className={`${field} mt-2`} rows={4} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'Charizard, Base Set, 220, 250\nUmbreon VMAX, Evolving Skies, 110'} aria-label="Paste buylist" />
          <button type="button" onClick={importLines} className="mt-2 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white">Import</button>
          {importMsg && <p className="mt-2 text-emerald-400">{importMsg}</p>}
        </details>
      </section>

      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Offer message templates</h3>
            <p className="text-[11px] text-slate-500 mt-1">Saved replies you can drop into an offer note in one click.</p>
          </div>
          <button
            type="button"
            disabled={templates.length >= MAX_TEMPLATES}
            onClick={() => { setTemplates([...templates, { title: '', body: '' }]); markDirty(); }}
            className="text-xs font-semibold text-blue-300 hover:text-white disabled:opacity-40"
          >
            + Add template
          </button>
        </div>
        {templates.map((t, i) => (
          <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
            <div className="flex gap-2">
              <input className={field} maxLength={60} placeholder="Template name, e.g. Great condition" aria-label={`Template ${i + 1} name`} value={t.title} onChange={(e) => { setTemplates(templates.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x))); markDirty(); }} />
              <button type="button" onClick={() => { setTemplates(templates.filter((_, idx) => idx !== i)); markDirty(); }} className="px-2 text-slate-500 hover:text-red-400" aria-label="Remove template">✕</button>
            </div>
            <textarea className={field} rows={3} maxLength={600} placeholder="Message to the collector" aria-label={`Template ${i + 1} message`} value={t.body} onChange={(e) => { setTemplates(templates.map((x, idx) => (idx === i ? { ...x, body: e.target.value } : x))); markDirty(); }} />
          </div>
        ))}
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
