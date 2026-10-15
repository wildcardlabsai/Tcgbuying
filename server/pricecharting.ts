/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CatalogCard } from './cardLookup';

// Optional second price source: PriceCharting (https://www.pricecharting.com/api-documentation), which
// aggregates recent eBay sales. It is a paid API, so this only runs when PRICECHARTING_API_KEY is set.
//
// Field names follow PriceCharting's published product response (`loose-price` is the ungraded price, in
// US cents). Check the values against pricecharting.com for a few cards after you add your key.
// By default the figure is shown next to TCGplayer as a cross-check; set PRICE_PRIMARY=pricecharting to
// make it the price that offers are based on.

const USD_GBP = 0.78;

export const pricechartingConfigured = () => Boolean(process.env.PRICECHARTING_API_KEY);

export async function withPriceCharting(card: CatalogCard): Promise<CatalogCard> {
  const key = process.env.PRICECHARTING_API_KEY;
  if (!key || !card.name) return card;
  const number = card.cardNumber.split('/')[0];
  const query = `pokemon ${card.setName} ${card.name} ${number}`.trim();
  try {
    const res = await fetch(`https://www.pricecharting.com/api/product?t=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return card;
    const j: any = await res.json();
    const cents = Number(j?.['loose-price']);
    if (j?.status === 'error' || !Number.isFinite(cents) || cents <= 0) return card;
    const gbp = Math.round((cents / 100) * USD_GBP * 100) / 100;
    const out: CatalogCard = {
      ...card,
      pricechartingPrice: gbp,
      pricechartingUrl: `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(query)}`,
    };
    if (process.env.PRICE_PRIMARY === 'pricecharting') {
      out.rawMarketPrice = gbp;
      out.priceKnown = true;
      out.priceSource = 'PriceCharting';
      out.priceLow = undefined;
      out.priceHigh = undefined;
    } else if (card.rawMarketPrice > 0) {
      const ratio = card.rawMarketPrice / gbp;
      if (ratio > 1.4 || ratio < 0.7) out.priceDisagree = true;
    }
    return out;
  } catch {
    return card;
  }
}
