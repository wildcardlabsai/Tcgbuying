/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LiveSubmission } from '../services/dealerSubmissionService';

/** Quote a CSV field and neutralise spreadsheet formulas (=, +, -, @) in user-supplied text. */
const cell = (v: unknown): string => {
  let s = v === undefined || v === null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export interface CsvOptions {
  /** Format a GBP amount for display (e.g. the dealer's chosen currency). */
  money: (gbp: number) => string;
}

export function submissionsToCsv(subs: LiveSubmission[], { money }: CsvOptions): string {
  const header = [
    'Reference', 'Date', 'Collector', 'Email', 'Phone', 'Status', 'Cards',
    'Estimated value', 'Calculated cash offer', 'Offer sent', 'Payout preference', 'Parcel posted', 'Tracking',
  ];
  const rows = subs.map((s) => [
    s.ref,
    s.date,
    s.collector,
    s.email,
    s.phone || '',
    s.status,
    s.cards,
    money(s.estValueGbp || 0),
    money(s.totalCashOffer || 0),
    s.offeredAmount || '',
    s.preferredPayout || '',
    s.parcel ? new Date(s.parcel.postedAt).toLocaleDateString('en-GB') : '',
    s.parcel ? `${s.parcel.carrier} ${s.parcel.trackingNumber}`.trim() : '',
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
