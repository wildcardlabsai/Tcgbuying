/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, TrendingUp } from 'lucide-react';

export default function BuylistTicker() {
  const tickerItems = [
    { name: '1999 Base Set Charizard #4/102', rate: '72% eBay Comp', payout: '£205 Cash / £240 Credit', game: 'Pokémon' },
    { name: 'Umbreon VMAX Alt Art #215/203', rate: 'High Demand', payout: '£490 Cash / £575 Credit', game: 'Pokémon' },
    { name: 'Black Lotus Unlimited Edition', rate: 'Vintage Verified', payout: '£6,120 Wire / £7,140 Credit', game: 'MTG' },
    { name: 'Pikachu Illustrator CoroCoro Promo', rate: 'PSA 9/10 Premium', payout: 'Instant Bank Wire', game: 'Pokémon' },
    { name: 'Blue-Eyes White Dragon 1st LOB-001', rate: 'Clean Holo Foil', payout: '£172 Cash / £202 Credit', game: 'Yu-Gi-Oh!' },
    { name: 'Bulk Modern Holos & Reverse Holos', rate: 'Any Quantity', payout: '5p / card flat rate', game: 'Bulk' },
    { name: 'Bulk Common / Uncommon Stacks', rate: 'Sorted / Unsorted', payout: '1.2p / card', game: 'Bulk' },
    { name: 'Double Masters Mana Crypt', rate: 'Borderless Foil', payout: '£104 Cash / £122 Credit', game: 'MTG' },
  ];

  return (
    <div className="bg-[#070d1e] text-slate-300 py-2.5 border-y border-slate-800 overflow-hidden relative select-none">
      <div className="flex items-center">
        {/* Static Header Label */}
        <div className="hidden sm:flex items-center gap-1.5 px-4 text-[11px] font-black uppercase tracking-wider text-amber-400 shrink-0 bg-[#070d1e] z-10 border-r border-slate-800">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span>Live Buylist Ticker</span>
        </div>

        {/* Marquee Content */}
        <div className="flex gap-8 whitespace-nowrap animate-marquee">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="font-bold text-white">{item.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {item.game}
              </span>
              <span className="text-emerald-400 font-semibold">{item.payout}</span>
              <span className="text-slate-600">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
