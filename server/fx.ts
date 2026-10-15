/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GBP -> EUR/USD reference rates (ECB via frankfurter.dev), cached for 12h with a static fallback.
// Values are units of each currency per 1 GBP.
export const FALLBACK_RATES = { EUR: 1.17, USD: 1.27 };

let cache: { at: number; rates: { EUR: number; USD: number } } | null = null;

export async function getGbpRates(): Promise<{ rates: { EUR: number; USD: number }; source: 'live' | 'fallback' }> {
  if (cache && Date.now() - cache.at < 12 * 3600_000) return { rates: cache.rates, source: 'live' };
  try {
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=GBP&symbols=EUR,USD', { signal: AbortSignal.timeout(5000) });
    const j: any = r.ok ? await r.json() : null;
    if (j?.rates?.EUR > 0 && j?.rates?.USD > 0) {
      cache = { at: Date.now(), rates: { EUR: j.rates.EUR, USD: j.rates.USD } };
      return { rates: cache.rates, source: 'live' };
    }
  } catch {
    /* fall through to the static rates */
  }
  return { rates: FALLBACK_RATES, source: 'fallback' };
}
