/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { fetchSold, GRADE_OPTIONS, Grade, SoldSummary } from '../services/soldService';
import { useMoney } from '../CurrencyContext';

interface SoldPanelProps {
  card: { name: string; cardNumber?: string; setName?: string };
  /** Pre-select a grade (e.g. from the condition the collector chose). */
  defaultGrade?: Grade;
  /** Shop currency: GBP looks at eBay UK, anything else at eBay US. */
  shopCurrency: string;
  /** Called with the eBay median (GBP) when the dealer wants to price from it. */
  onUseMedian?: (medianGbp: number) => void;
  useMedianLabel?: string;
}

/** On-demand "recent eBay sold prices" for a card, fetched only when the dealer asks (each lookup costs one request). */
export default function SoldPanel({ card, defaultGrade = 'raw', shopCurrency, onUseMedian, useMedianLabel }: SoldPanelProps) {
  const { fmt } = useMoney();
  const [grade, setGrade] = useState<Grade>(defaultGrade);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SoldSummary | null>(null);

  const load = async (g: Grade = grade) => {
    setBusy(true);
    setError(null);
    try {
      setData(await fetchSold({ name: card.name, number: card.cardNumber, setName: card.setName }, g, shopCurrency));
    } catch (err) {
      setData(null);
      setError((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={grade}
          aria-label="Grade to look up"
          onChange={(e) => {
            const g = e.target.value as Grade;
            setGrade(g);
            if (data) load(g);
          }}
          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-white"
        >
          {GRADE_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => load()}
          disabled={busy}
          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold flex items-center gap-1"
        >
          {busy && <Loader2 className="w-3 h-3 animate-spin" />}
          {data ? 'Refresh' : 'Check eBay sold prices'}
        </button>
      </div>

      {error && <p className="mt-2 text-amber-300">{error}</p>}

      {data && (
        <div className="mt-2 space-y-2">
          {data.median === null ? (
            <p className="text-amber-300">No clean eBay sales found in the last {data.windowDays} days for this search.</p>
          ) : (
            <>
              <p>
                <span className="text-base font-black text-white">{fmt(data.median)}</span> median from {data.count} recent sale{data.count === 1 ? '' : 's'}
                {data.low !== null && data.high !== null && data.low !== data.high && (
                  <span className="text-slate-400"> · {fmt(data.low)}–{fmt(data.high)}</span>
                )}
              </p>
              {data.count < 3 && <p className="text-amber-300">Only {data.count} sale{data.count === 1 ? '' : 's'}, so treat this as a rough guide.</p>}
              {onUseMedian && (
                <button
                  type="button"
                  onClick={() => onUseMedian(data.median!)}
                  className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold"
                >
                  {useMedianLabel || 'Price from this'}
                </button>
              )}
              <ul className="divide-y divide-slate-800 border border-slate-800 rounded">
                {data.recent.slice(0, 6).map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 px-2 py-1">
                    <span className="min-w-0 truncate" title={s.title}>
                      <span className="text-slate-500">{s.date}</span> · {s.title}
                    </span>
                    <span className="shrink-0 flex items-center gap-2">
                      <span className="font-semibold text-white">{fmt(s.price)}</span>
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label="Open this sale on eBay" className="text-blue-400 hover:text-blue-300">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="text-[10px] text-slate-500">
            eBay sold listings from the last {data.windowDays} days ({data.site}), via SoldComps. Best Offer sales ({data.excludedBestOffer}) and
            lots, other cards and outliers ({data.excludedOther}) are left out.{data.cached ? ' Cached from earlier today.' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
