/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// All stored money (card values, offers, totals) is in GBP. Currencies below are display-only
// conversions of that base, using ECB rates from /api/rates when available.

export type CurrencyCode = 'GBP' | 'EUR' | 'USD';

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'USD', label: 'USD ($)', symbol: '$' },
];

/** Units of each currency per 1 GBP. Used until live rates load. */
export const FALLBACK_RATES: Record<CurrencyCode, number> = { GBP: 1, EUR: 1.17, USD: 1.27 };

export const isCurrency = (v: unknown): v is CurrencyCode => v === 'GBP' || v === 'EUR' || v === 'USD';

export const symbolOf = (c: CurrencyCode) => CURRENCIES.find((x) => x.code === c)!.symbol;

export function convertFromGbp(gbp: number, to: CurrencyCode, rates: Record<CurrencyCode, number>): number {
  return gbp * (rates[to] ?? 1);
}

export function convertToGbp(amount: number, from: CurrencyCode, rates: Record<CurrencyCode, number>): number {
  return amount / (rates[from] || 1);
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const whole = Math.abs(amount - Math.round(amount)) < 0.005;
  return amount.toLocaleString('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Round to 2 decimal places (avoids float noise like 0.30000000000000004). */
export const r2 = (n: number) => Math.round(n * 100) / 100;
