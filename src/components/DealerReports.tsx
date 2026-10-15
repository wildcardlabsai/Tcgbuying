/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { LiveSubmission } from '../services/dealerSubmissionService';
import { useMoney } from '../CurrencyContext';
import { downloadCsv, submissionsToCsv } from '../utils/csv';

const DAY = 86_400_000;
const toMs = (t: any): number => (typeof t === 'number' ? t : (t?.toMillis?.() ?? 0));

export default function DealerReports({ submissions }: { submissions: LiveSubmission[] }) {
  const { fmt } = useMoney();
  const [days, setDays] = useState<7 | 30>(7);

  const stats = useMemo(() => {
    const since = Date.now() - days * DAY;
    const inRange = submissions.filter((s) => toMs(s.createdAt) >= since);
    const count = (st: LiveSubmission['status'][]) => inRange.filter((s) => st.includes(s.status)).length;
    const bought = inRange.filter((s) => s.status === 'Accepted' || s.status === 'Completed');
    const decided = bought.length + inRange.filter((s) => s.status === 'Declined').length;
    const boughtValue = bought.reduce((sum, s) => sum + (s.offerGbp ?? s.totalCashOffer ?? 0), 0);
    const turnaround = inRange
      .filter((s) => toMs(s.offeredAt) > 0 && toMs(s.createdAt) > 0)
      .map((s) => (toMs(s.offeredAt) - toMs(s.createdAt)) / 3_600_000);
    const avgHours = turnaround.length ? turnaround.reduce((a, b) => a + b, 0) / turnaround.length : null;

    // Submissions per day, oldest first
    const buckets = Array.from({ length: days }, (_, i) => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setTime(start.getTime() - (days - 1 - i) * DAY);
      return { start: start.getTime(), label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), n: 0 };
    });
    inRange.forEach((s) => {
      const b = [...buckets].reverse().find((x) => toMs(s.createdAt) >= x.start);
      if (b) b.n++;
    });

    return {
      received: inRange.length,
      offers: count(['Offer Sent', 'Accepted', 'Completed', 'Declined']),
      bought: bought.length,
      declined: inRange.filter((s) => s.status === 'Declined').length,
      acceptance: decided ? Math.round((bought.length / decided) * 100) : null,
      boughtValue,
      avgHours,
      buckets,
      inRange,
    };
  }, [submissions, days]);

  const max = Math.max(1, ...stats.buckets.map((b) => b.n));
  const tile = 'bg-slate-900 rounded-xl border border-slate-800 p-4';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Reports</h2>
          <p className="text-xs text-slate-400 mt-1">How your buying is going.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden text-xs">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={`px-3 py-1.5 font-semibold ${days === d ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
              >
                Last {d} days
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(`tcgbuyer-submissions-${new Date().toISOString().slice(0, 10)}.csv`, submissionsToCsv(submissions, { money: fmt }))}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> Export all (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={tile}>
          <p className="text-[11px] text-slate-400">Submissions received</p>
          <p className="text-2xl font-black text-white">{stats.received}</p>
        </div>
        <div className={tile}>
          <p className="text-[11px] text-slate-400">Offers made</p>
          <p className="text-2xl font-black text-white">{stats.offers}</p>
        </div>
        <div className={tile}>
          <p className="text-[11px] text-slate-400">Acceptance rate</p>
          <p className="text-2xl font-black text-emerald-400">{stats.acceptance === null ? '–' : `${stats.acceptance}%`}</p>
          <p className="text-[10px] text-slate-500">{stats.bought} bought, {stats.declined} declined</p>
        </div>
        <div className={tile}>
          <p className="text-[11px] text-slate-400">Avg. time to offer</p>
          <p className="text-2xl font-black text-white">
            {stats.avgHours === null ? '–' : stats.avgHours < 1 ? `${Math.round(stats.avgHours * 60)} min` : `${stats.avgHours.toFixed(1)} hrs`}
          </p>
        </div>
      </div>

      <div className={tile}>
        <p className="text-[11px] text-slate-400">Value bought (accepted + paid)</p>
        <p className="text-3xl font-black text-emerald-400">{fmt(stats.boughtValue)}</p>
        <p className="text-[10px] text-slate-500 mt-1">Uses the offer amount you sent where available, otherwise the calculated cash offer.</p>
      </div>

      <div className={tile}>
        <p className="text-xs font-bold text-slate-300 mb-3">Submissions per day</p>
        <div className="flex items-end gap-1 h-32" role="img" aria-label="Bar chart of submissions per day">
          {stats.buckets.map((b) => (
            <div key={b.start} className="flex-1 flex flex-col items-center justify-end h-full min-w-0" title={`${b.label}: ${b.n}`}>
              <span className="text-[9px] text-slate-400 mb-0.5">{b.n || ''}</span>
              <div className="w-full rounded-t bg-blue-500/80" style={{ height: `${(b.n / max) * 100}%`, minHeight: b.n ? 4 : 1, opacity: b.n ? 1 : 0.25 }} />
              {days === 7 && <span className="text-[9px] text-slate-500 mt-1 truncate">{b.label}</span>}
            </div>
          ))}
        </div>
      </div>

      {submissions.length === 0 && <p className="text-xs text-slate-500">Reports fill in as submissions arrive.</p>}
    </div>
  );
}
