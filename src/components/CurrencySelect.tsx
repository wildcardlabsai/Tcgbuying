/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENCIES, CurrencyCode } from '../services/currency';
import { useMoney } from '../CurrencyContext';

export default function CurrencySelect({ className = '' }: { className?: string }) {
  const { currency, setCurrency } = useMoney();
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      aria-label="Currency"
      className={`bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-lg px-2 py-1.5 cursor-pointer ${className}`}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
