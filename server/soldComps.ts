/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getGbpRates } from './fx';

// eBay "last sold" prices through SoldComps (https://sold-comps.com/docs).
// Set SOLD_COMPS_API_KEY on the server. Each lookup is one request against your SoldComps allowance
// (free plan: 100 a month), so results are cached for a day and the allowance is checked before spending.

const BASE = 'https://api.sold-comps.com';
const CATEGORY_ID = process.env.SOLD_COMPS_CATEGORY_ID || '183454'; // eBay: Collectible Card Games > CCG Individual Cards
const WINDOW_DAYS = 90;
const CACHE_MS = 24 * 3600_000;
const RESERVE = 3; // leave a few requests spare

export const soldCompsConfigured = () => Boolean(process.env.SOLD_COMPS_API_KEY);

export type SoldErrorKind = 'not_configured' | 'invalid_key' | 'quota' | 'rate_limited' | 'upstream' | 'budget';
export class SoldError extends Error {
  constructor(public kind: SoldErrorKind, message?: string) {
    super(message || kind);
  }
}

export type Grade = 'raw' | 'psa10' | 'psa9' | 'bgs95' | 'cgc10';
export const GRADES: Record<Grade, { label: string; terms: string; match: RegExp | null }> = {
  raw: { label: 'Raw (ungraded)', terms: '-psa -bgs -cgc -sgc -ace -graded -slab -beckett', match: null },
  psa10: { label: 'PSA 10', terms: 'psa 10', match: /\bpsa\s*-?\s*10\b/i },
  psa9: { label: 'PSA 9', terms: 'psa 9', match: /\bpsa\s*-?\s*9\b/i },
  bgs95: { label: 'BGS 9.5', terms: 'bgs 9.5', match: /\bbgs\s*-?\s*9\.5\b/i },
  cgc10: { label: 'CGC 10', terms: 'cgc 10', match: /\bcgc\s*-?\s*10\b/i },
};
export const isGrade = (g: unknown): g is Grade => typeof g === 'string' && g in GRADES;

export interface SoldSale {
  /** GBP */
  price: number;
  date: string;
  title: string;
  url: string;
  bids: number | null;
}

export interface SoldSummary {
  query: string;
  site: string;
  grade: Grade;
  /** Median of the cleaned sales, in GBP; null when there were none. */
  median: number | null;
  low: number | null;
  high: number | null;
  count: number;
  windowDays: number;
  excludedBestOffer: number;
  excludedOther: number;
  recent: SoldSale[];
  fetchedAt: string;
  cached: boolean;
}

export interface SoldQuery {
  name: string;
  number?: string;
  setName?: string;
  grade: Grade;
  /** 'GBP' uses ebay.co.uk (prices in pounds); anything else uses ebay.com (US dollars). */
  currency: string;
}

// ---------- allowance ----------
interface Usage { plan: string; limit: number; used: number; remaining: number; reset_at: string; credits: number }
let usageCache: { at: number; value: Usage } | null = null;

async function call(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${process.env.SOLD_COMPS_API_KEY}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(25_000),
  });
}

/** Remaining SoldComps allowance. This call is free and does not count against the quota. */
export async function getUsage(force = false): Promise<Usage | null> {
  if (!soldCompsConfigured()) return null;
  if (!force && usageCache && Date.now() - usageCache.at < 5 * 60_000) return usageCache.value;
  try {
    const res = await call('/usage');
    if (!res.ok) return null;
    const j: any = await res.json();
    const value: Usage = {
      plan: j.plan_label || j.plan || '',
      limit: Number(j.usage?.limit) || 0,
      used: Number(j.usage?.used) || 0,
      remaining: Number(j.usage?.remaining) || 0,
      reset_at: j.usage?.reset_at || '',
      credits: Number(j.credits?.balance) || 0,
    };
    usageCache = { at: Date.now(), value };
    return value;
  } catch {
    return null;
  }
}

// ---------- query + cleaning ----------
const EXCLUDE = '-lot -bundle -proxy -custom -replica -reprint -repack -digital -empty';

export function buildKeyword(q: SoldQuery): string {
  const parts = ['pokemon', q.name.trim()];
  if (q.number) parts.push(q.number.trim());
  else if (q.setName) parts.push(q.setName.trim());
  parts.push(GRADES[q.grade].terms, EXCLUDE);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const BAD_TITLE = /\b(lot|bundle|proxy|custom|replica|reprint|repack|digital|empty|binder|collection|sealed|booster|bulk)\b/i;

function median(sorted: number[]): number {
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

/** Turn raw SoldComps items into a clean summary. Exported for testing. */
export function summarise(
  items: any[],
  q: SoldQuery,
  site: string,
  toGbp: (amount: number, currency: string) => number | null,
  now = Date.now()
): Omit<SoldSummary, 'cached' | 'fetchedAt' | 'query'> {
  const nameWords = q.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !['ex', 'vmax', 'vstar'].includes(w));
  const number = q.number?.split('/')[0].replace(/^0+(?=\d)/, '');
  const gradeRe = GRADES[q.grade].match;
  const since = now - WINDOW_DAYS * 86_400_000;

  let excludedBestOffer = 0;
  let excludedOther = 0;
  const clean: SoldSale[] = [];

  for (const it of items) {
    if (it?.listingType && it.listingType !== 'sold') continue;
    const title = String(it?.title || '');
    const lower = title.toLowerCase();
    const raw = Number(it?.soldPrice);
    const date = String(it?.endedAt || '');
    const when = Date.parse(date);
    const price = Number.isFinite(raw) && raw > 0 ? toGbp(raw, String(it?.soldCurrency || '')) : null;

    const sameCard = nameWords.every((w) => lower.includes(w)) && (!number || new RegExp(`(^|[^0-9])0*${number}([^0-9]|$)`).test(title));
    const gradeOk = gradeRe ? gradeRe.test(title) : !/\b(psa|bgs|cgc|sgc|graded|slab)\b/i.test(title);
    if (price === null || !sameCard || !gradeOk || BAD_TITLE.test(title) || (Number.isFinite(when) && when < since)) {
      excludedOther++;
      continue;
    }
    // Best Offer sales usually report the asking price, not what was actually paid, so they are left out.
    if (it?.bestOfferAccepted && !(it?.boaHydrated && it?.boaAcceptedCurrency === it?.soldCurrency)) {
      excludedBestOffer++;
      continue;
    }
    clean.push({ price, date, title, url: String(it?.url || ''), bids: typeof it?.bidCount === 'number' ? it.bidCount : null });
  }

  // Drop wild outliers (wrong card, damaged, mislisted): outside 0.4x to 2.5x of the median of what is left.
  let kept = clean;
  if (clean.length >= 5) {
    const m = median(clean.map((s) => s.price).sort((a, b) => a - b));
    kept = clean.filter((s) => s.price >= m * 0.4 && s.price <= m * 2.5);
    excludedOther += clean.length - kept.length;
  }
  kept.sort((a, b) => (a.date < b.date ? 1 : -1));
  const prices = kept.slice(0, 30).map((s) => s.price).sort((a, b) => a - b);

  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    grade: q.grade,
    site,
    median: prices.length ? r2(median(prices)) : null,
    low: prices.length ? r2(prices[0]) : null,
    high: prices.length ? r2(prices[prices.length - 1]) : null,
    count: prices.length,
    windowDays: WINDOW_DAYS,
    excludedBestOffer,
    excludedOther,
    recent: kept.slice(0, 8).map((s) => ({ ...s, price: r2(s.price) })),
  };
}

// ---------- lookup ----------
const cache = new Map<string, { at: number; value: SoldSummary }>();
// Concurrent identical lookups share one request
const inflight = new Map<string, Promise<SoldSummary>>();

export async function lookupSold(q: SoldQuery): Promise<SoldSummary> {
  if (!soldCompsConfigured()) throw new SoldError('not_configured');
  const site = q.currency === 'GBP' ? 'ebay.co.uk' : 'ebay.com';
  const keyword = buildKeyword(q);
  const key = `${site}|${keyword}`;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ...hit.value, cached: true };
  const pending = inflight.get(key);
  if (pending) return pending;

  const run = (async () => {
    const usage = await getUsage();
    if (usage && usage.remaining + usage.credits <= RESERVE) throw new SoldError('budget');

    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
    const params = new URLSearchParams({
      keyword,
      ebaySite: site,
      count: '60',
      sortOrder: 'endedRecently',
      categoryId: CATEGORY_ID,
      soldAfter: since,
    });
    if (process.env.SOLD_COMPS_HYDRATE_BOA === 'true') params.set('hydrateBoa', 'true');

    let res: Response;
    try {
      res = await call(`/v1/scrape?${params.toString()}`);
    } catch {
      throw new SoldError('upstream', 'timeout');
    }
    if (res.status === 401) throw new SoldError('invalid_key');
    if (res.status === 429) {
      const body: any = await res.json().catch(() => ({}));
      throw new SoldError(body?.code === 'quota_exceeded' ? 'quota' : 'rate_limited');
    }
    if (!res.ok) throw new SoldError('upstream', `http_${res.status}`);

    const data: any = await res.json();
    if (usageCache) usageCache.value = { ...usageCache.value, remaining: Math.max(0, usageCache.value.remaining - 1) };

    const { rates } = await getGbpRates();
    const toGbp = (amount: number, currency: string) =>
      currency === 'GBP' ? amount : currency === 'USD' ? amount / rates.USD : currency === 'EUR' ? amount / rates.EUR : null;

    const summary: SoldSummary = {
      query: keyword,
      fetchedAt: new Date().toISOString(),
      cached: false,
      ...summarise(Array.isArray(data?.items) ? data.items : [], q, site, toGbp),
    };
    cache.set(key, { at: Date.now(), value: summary });
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    return summary;
  })();

  inflight.set(key, run);
  try {
    return await run;
  } finally {
    inflight.delete(key);
  }
}
