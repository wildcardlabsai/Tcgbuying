/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign, Sparkles, ArrowRight } from 'lucide-react';

interface RoiCalculatorSectionProps {
  onGetStarted: () => void;
}

export default function RoiCalculatorSection({ onGetStarted }: RoiCalculatorSectionProps) {
  const [collectionsPerMonth, setCollectionsPerMonth] = useState(20);
  const [avgCollectionValue, setAvgCollectionValue] = useState(650);

  // Computed ROI
  const hoursSavedPerMonth = Math.round(collectionsPerMonth * 1.5);
  const monthlyBuylistVolume = collectionsPerMonth * avgCollectionValue;
  const recapturedRevenue = Math.round(monthlyBuylistVolume * 0.32); // 32% more volume from online intake
  const additionalStoreMargin = Math.round(recapturedRevenue * 0.28); // 28% profit spread

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden border-t border-b border-slate-800">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 bg-blue-900/40 border border-blue-500/30 px-3 py-1 rounded-full inline-block mb-3">
            Shop Revenue & Time Calculator
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Calculate your store's trade-in upside
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            See how many staff hours TCGBuyer saves your shop every week, and how much additional inventory you capture with your own online buying portal.
          </p>
        </div>

        {/* Calculator Widget */}
        <div className="max-w-4xl mx-auto bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Controls: Sliders */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Slider 1: Collections Per Month */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Collections bought per month:</span>
                  <span className="font-mono text-base font-black text-blue-400">
                    {collectionsPerMonth} collections
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={80}
                  step={1}
                  value={collectionsPerMonth}
                  onChange={(e) => setCollectionsPerMonth(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>3 / mo</span>
                  <span>40 / mo</span>
                  <span>80+ / mo</span>
                </div>
              </div>

              {/* Slider 2: Average Collection Value */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Average collection market value:</span>
                  <span className="font-mono text-base font-black text-emerald-400">
                    £{avgCollectionValue.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={3000}
                  step={50}
                  value={avgCollectionValue}
                  onChange={(e) => setAvgCollectionValue(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>£150 (Singles)</span>
                  <span>£1,500 (Binders)</span>
                  <span>£3,000+ (High-End Vintage)</span>
                </div>
              </div>

              {/* Highlights */}
              <div className="pt-2 text-xs text-slate-400 space-y-2 border-t border-slate-800/80">
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Replaces manual eBay search copying & pasting across staff.
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Converts local social media followers into active collection sellers.
                </p>
              </div>

            </div>

            {/* Right Display: Live Output Cards */}
            <div className="lg:col-span-6 bg-gradient-to-br from-blue-950/60 to-purple-950/40 border border-blue-500/30 rounded-2xl p-6 space-y-4">
              
              {/* Stat 1: Hours Saved */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Staff Time Saved
                    </span>
                    <span className="text-xl font-black text-white">
                      {hoursSavedPerMonth} hours / month
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-300 font-semibold bg-blue-500/10 px-2 py-1 rounded">
                  ~{Math.round(hoursSavedPerMonth / 4)} hrs/wk
                </span>
              </div>

              {/* Stat 2: Additional Buy Volume */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Recaptured Buy Volume
                    </span>
                    <span className="text-xl font-black text-emerald-400">
                      +£{recapturedRevenue.toLocaleString()} / mo
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-1 rounded">
                  +32% volume
                </span>
              </div>

              {/* Stat 3: Estimated Net Profit Spread */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Est. Extra Resale Profit
                    </span>
                    <span className="text-xl font-black text-amber-400">
                      +£{additionalStoreMargin.toLocaleString()} / mo
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-1 rounded">
                  at 28% margin
                </span>
              </div>

              {/* Call to action */}
              <button
                onClick={onGetStarted}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>Deploy TCGBuyer for Your Shop</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
