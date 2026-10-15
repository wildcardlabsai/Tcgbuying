/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, TrendingUp } from 'lucide-react';

export default function BuylistTicker() {
  // Illustrative offers at 72% cash / 84% credit; a real shop sets its own rates.
  const tickerItems = [
    { name: 'Base Set Charizard #4/102', payout: '£205 cash / £239 credit', game: 'Pokémon' },
    { name: 'Umbreon VMAX Alt Art #215/203', payout: '£108 cash / £126 credit', game: 'Pokémon' },
    { name: 'Mana Crypt, Double Masters', payout: '£130 cash / £151 credit', game: 'MTG' },
    { name: 'Blue-Eyes White Dragon LOB-001', payout: '£86 cash / £101 credit', game: 'Yu-Gi-Oh!' },
    { name: 'Bulk holos and reverse holos', payout: '5p per card', game: 'Bulk' },
    { name: 'Bulk commons and uncommons', payout: '1.2p per card', game: 'Bulk' },
    { name: 'Sealed booster packs', payout: '£3.20 per pack', game: 'Sealed' },
  ];

  return (
    <div className="bg-[#070d1e] text-slate-300 py-2.5 border-y border-slate-800 overflow-hidden relative select-none">
      <div className="flex items-center">
        {/* Static Header Label */}
        <div className="hidden sm:flex items-center gap-1.5 px-4 text-[11px] font-black uppercase tracking-wider text-amber-400 shrink-0 bg-[#070d1e] z-10 border-r border-slate-800">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span>Example offers</span>
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
