/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import {
  CurrencyCode,
  FALLBACK_RATES,
  convertFromGbp,
  convertToGbp,
  formatMoney,
  isCurrency,
  symbolOf,
} from './services/currency';
import { LiveSubmission } from './services/dealerSubmissionService';

const STORAGE_KEY = 'tcg_currency';

interface MoneyApi {
  currency: CurrencyCode;
  symbol: string;
  setCurrency: (c: CurrencyCode) => void;
  /** The currency used when the viewer hasn't picked one (the shop's default). */
  setDefaultCurrency: (c: CurrencyCode) => void;
  /** Format a GBP amount in the viewer's currency. */
  fmt: (gbp: number) => string;
  /** Format a GBP amount in a specific currency. */
  fmtIn: (gbp: number, c: CurrencyCode) => string;
  /** Convert an amount typed in `from` into GBP. */
  toGbp: (amount: number, from: CurrencyCode) => number;
  fromGbp: (gbp: number, to: CurrencyCode) => number;
  /** What the shop offered (typed text wins), else the computed offer, formatted for display. */
  offerText: (sub: LiveSubmission) => string;
  ratesLive: boolean;
}

const Ctx = createContext<MoneyApi | null>(null);

function readChoice(): CurrencyCode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isCurrency(v) ? v : null;
  } catch {
    return null;
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<CurrencyCode | null>(readChoice);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('GBP');
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [ratesLive, setRatesLive] = useState(false);

  useEffect(() => {
    fetch('/api/rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.rates?.EUR > 0 && j?.rates?.USD > 0) {
          setRates({ GBP: 1, EUR: j.rates.EUR, USD: j.rates.USD });
          setRatesLive(j.source === 'live');
        }
      })
      .catch(() => {});
  }, []);

  const currency = choice ?? defaultCurrency;

  const setCurrency = useCallback((c: CurrencyCode) => {
    setChoice(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* storage unavailable: choice still applies for this session */
    }
  }, []);

  const api = useMemo<MoneyApi>(() => {
    const fmtIn = (gbp: number, c: CurrencyCode) => formatMoney(convertFromGbp(gbp, c, rates), c);
    const fmt = (gbp: number) => fmtIn(gbp, currency);
    return {
      currency,
      symbol: symbolOf(currency),
      setCurrency,
      setDefaultCurrency,
      fmt,
      fmtIn,
      toGbp: (amount, from) => convertToGbp(amount, from, rates),
      fromGbp: (gbp, to) => convertFromGbp(gbp, to, rates),
      offerText: (sub) => {
        if (sub.offeredAmount) return sub.offeredAmount;
        const gbp = sub.totalCashOffer || sub.estValueGbp || 0;
        return fmt(gbp);
      },
      ratesLive,
    };
  }, [currency, rates, ratesLive, setCurrency]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useMoney(): MoneyApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMoney must be used inside <CurrencyProvider>');
  return v;
}
