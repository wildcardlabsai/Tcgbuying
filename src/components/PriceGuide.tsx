/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchAlternativeCards, MatchedCard } from '../services/cardRecognitionService';
import { Storefront, DEFAULT_PRICING } from '../services/storefrontService';
import { useMoney } from '../CurrencyContext';
import CardLinks from './CardLinks';
import PriceDetails from './PriceDetails';
import SoldPanel from './SoldPanel';
import { fetchSoldStatus, SoldStatus } from '../services/soldService';

/** Live Pokémon price lookup for dealers: real market prices, per printing, with your offer percentages applied. */
export default function PriceGuide({ storefront }: { storefront: Storefront | null }) {
  const { fmt } = useMoney();
  const pricing = storefront?.pricing ?? DEFAULT_PRICING;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MatchedCard[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SoldStatus | null>(null);
  useEffect(() => {
    fetchSoldStatus().then(setStatus);
  }, []);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setResults(await searchAlternativeCards(query, 'Pokémon'));
    } catch (err) {
      setResults(null);
      setError((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black text-white">Price Guide</h2>
        <p className="text-xs text-slate-400 mt-1">
          Look up any Pokémon card. Prices are TCGplayer market prices (based on recent TCGplayer sales) with Cardmarket as a cross-check.
          For a big offer, use <strong className="text-slate-200">Check eBay sold prices</strong> on a card to see what it actually sold for on eBay recently.
        </p>
        {status && (
          <p className="text-[11px] mt-2 text-slate-500">
            {!status.configured
              ? 'eBay sold prices: not set up (add SOLD_COMPS_API_KEY on the server).'
              : status.ok
                ? `eBay sold prices: connected${status.plan ? ` (${status.plan})` : ''} · ${status.remaining} lookups left${status.resetAt ? ` until ${new Date(status.resetAt).toLocaleDateString('en-GB')}` : ''}. Each check uses one; repeat checks of a card are cached for a day.`
                : 'eBay sold prices: could not check the allowance right now.'}
          </p>
        )}
      </div>

      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Charizard 4/102, Umbreon VMAX, Pikachu"
            aria-label="Card name or number"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-bold text-white flex items-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Look up
        </button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {results && results.length === 0 && <p className="text-xs text-slate-400">No matching Pokémon cards found.</p>}

      <div className="space-y-3">
        {(results || []).map((card) => (
          <div key={card.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex gap-4">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="w-20 h-28 object-contain rounded shrink-0" loading="lazy" />
            ) : (
              <div className="w-20 h-28 rounded bg-slate-800 shrink-0" />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-bold text-white">{card.name}</h3>
              <p className="text-xs text-slate-400">
                {card.setName} · #{card.cardNumber} {card.rarity && `· ${card.rarity}`}
              </p>
              <p className="text-sm">
                <span className="font-bold text-white">{card.marketPrice > 0 ? fmt(card.marketPrice) : 'No price'}</span>
                <span className="text-slate-400"> market</span>
                {card.marketPrice > 0 && (
                  <span className="text-emerald-400 text-xs ml-3">
                    You offer {fmt((card.marketPrice * pricing.cashPercent) / 100)} cash / {fmt((card.marketPrice * pricing.creditPercent) / 100)} credit
                  </span>
                )}
              </p>
              {(card.variants?.length ?? 0) > 1 && (
                <p className="text-[11px] text-slate-300">
                  {card.variants!.map((v) => `${v.label} ${fmt(v.price)}`).join(' · ')}
                </p>
              )}
              <PriceDetails card={card} fmt={fmt} />
              <CardLinks card={card} />
              {status?.configured && (
                <SoldPanel card={card} shopCurrency={pricing.currency} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
