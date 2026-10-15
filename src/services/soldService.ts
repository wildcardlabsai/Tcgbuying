/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth } from '../firebase';
import { IS_LOCAL } from '../config';

export type Grade = 'raw' | 'psa10' | 'psa9' | 'bgs95' | 'cgc10';
export const GRADE_OPTIONS: { value: Grade; label: string }[] = [
  { value: 'raw', label: 'Raw (ungraded)' },
  { value: 'psa10', label: 'PSA 10' },
  { value: 'psa9', label: 'PSA 9' },
  { value: 'bgs95', label: 'BGS 9.5' },
  { value: 'cgc10', label: 'CGC 10' },
];

/** Map the condition a collector picked to the closest sold-price search. */
export function gradeFromCondition(condition?: string): Grade {
  const c = (condition || '').toUpperCase();
  if (c.includes('PSA 10')) return 'psa10';
  if (c.includes('PSA 9')) return 'psa9';
  if (c.includes('BGS 9.5')) return 'bgs95';
  if (c.includes('CGC 10')) return 'cgc10';
  return 'raw';
}

export interface SoldSale {
  price: number; // GBP
  date: string;
  title: string;
  url: string;
  bids: number | null;
}
export interface SoldSummary {
  query: string;
  site: string;
  grade: Grade;
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

const MESSAGES: Record<string, string> = {
  not_configured: 'eBay sold prices are not set up yet (the SoldComps key is missing on the server).',
  invalid_key: 'The SoldComps key was rejected. Check SOLD_COMPS_API_KEY.',
  quota: 'The SoldComps monthly allowance is used up. It resets with your billing period, or add credits.',
  budget: 'The SoldComps allowance is almost used up, so lookups are paused to keep a few spare.',
  rate_limited: 'Too many lookups just now. Please wait a minute and try again.',
  sign_in_required: 'Sign in to look up eBay sold prices.',
  upstream: 'eBay sold prices are temporarily unavailable. Try again shortly.',
  invalid: 'That card could not be searched.',
};

export async function fetchSold(
  card: { name: string; number?: string; setName?: string },
  grade: Grade,
  currency: string
): Promise<SoldSummary> {
  const params = new URLSearchParams({ name: card.name, grade, currency });
  if (card.number) params.set('number', card.number);
  if (card.setName) params.set('set', card.setName);

  const headers: Record<string, string> = {};
  if (!IS_LOCAL) {
    const token = await auth.currentUser?.getIdToken().catch(() => undefined);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`/api/sold?${params.toString()}`, { headers });
  } catch {
    throw new Error('Could not reach the server.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) throw new Error(MESSAGES[data?.error] || 'Could not load eBay sold prices.');
  return data.summary as SoldSummary;
}

export interface SoldStatus {
  configured: boolean;
  ok?: boolean;
  plan?: string;
  remaining?: number;
  limit?: number;
  resetAt?: string;
}
export async function fetchSoldStatus(): Promise<SoldStatus> {
  try {
    const res = await fetch('/api/sold-status');
    return res.ok ? await res.json() : { configured: false };
  } catch {
    return { configured: false };
  }
}
