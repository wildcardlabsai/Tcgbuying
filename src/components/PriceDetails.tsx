/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchedCard } from '../services/cardRecognitionService';

/** Shows where a card's price comes from, how fresh it is, and how other sources compare. */
export default function PriceDetails({ card, fmt }: { card: MatchedCard; fmt: (gbp: number) => string }) {
  if (!card.priceSource && !card.cardmarketPrice) {
    return <p className="mt-1 text-[11px] text-amber-300">No market price found for this card. The shop will price it.</p>;
  }
  const updated = card.priceUpdated ? card.priceUpdated.replace(/\//g, '-') : '';
  return (
    <div className="mt-1 text-[11px] text-slate-400 space-y-0.5">
      <p>
        {card.priceSource ? `${card.priceSource} market price` : 'Market price'}
        {card.priceLow && card.priceHigh ? ` · range ${fmt(card.priceLow)}–${fmt(card.priceHigh)}` : ''}
        {updated ? ` · updated ${updated}` : ''}
      </p>
      {card.cardmarketPrice && <p>Cardmarket avg {fmt(card.cardmarketPrice)}</p>}
      {card.priceDisagree && (
        <p className="text-amber-300">Price sources differ for this card, so the shop will double-check the value.</p>
      )}
    </div>
  );
}
