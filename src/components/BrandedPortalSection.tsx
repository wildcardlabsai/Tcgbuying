/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CheckCircle2, ArrowRight, Plus, Shield } from 'lucide-react';
import cardsBannerImg from '../assets/images/tcg_cards_collection_1792010946389.jpg';

interface BrandedPortalSectionProps {
  onGetStarted: () => void;
}

export default function BrandedPortalSection({ onGetStarted }: BrandedPortalSectionProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  return (
    <section id="features" className="py-20 lg:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Brand copy and checklist */}
          <div className="lg:col-span-6">
            <span className="text-[12px] font-bold tracking-wider text-blue-600 uppercase mb-3 block">
              MADE FOR YOUR SHOP
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-5">
              Your buying process. <br />
              Your brand. Your customers.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              TCGBuyer is designed to help independent card shops and established TCG
              businesses create a more organised way to buy collections, without making
              the process feel complicated for their customers.
            </p>

            {/* Checklist with circular blue icons */}
            <div className="space-y-3.5 mb-8">
              {[
                'Branded buying portal for your shop',
                'Simple, easy-to-use submission process',
                'Manage offers and communication',
                'Keep everything in one place',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-800 font-medium text-[15px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Customer-Facing Portal Widget ("THE CARD VAULT") */}
          <div className="lg:col-span-6">
            <div className="max-w-[480px] mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              
              {/* Branded Header Bar */}
              <div className="bg-[#0b1329] text-white px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="font-extrabold tracking-wider text-xs uppercase text-white flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
                    <Shield className="w-2.5 h-2.5 fill-amber-400" />
                  </div>
                  THE CARD VAULT
                </span>
                <nav className="flex items-center gap-3 text-[10px] text-slate-300">
                  <span className="text-white font-semibold">Sell Cards</span>
                  <span>How It Works</span>
                  <span>FAQ</span>
                  <span>Contact</span>
                </nav>
              </div>

              {/* Photographic Banner */}
              <div className="relative py-7 px-5 text-center text-white bg-slate-900 overflow-hidden">
                <img
                  src={cardsBannerImg}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-25"
                />
                <div className="relative z-10">
                  <h3 className="text-base font-bold text-white mb-1">
                    Sell Your Cards to The Card Vault
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Get a fair offer for your trading cards. Fast, easy and secure.
                  </p>
                </div>
              </div>

              {/* Portal Content Area */}
              <div className="p-5">
                {/* Step Progress Line: 1 Add Cards, 2 Review, 3 Submit */}
                <div className="flex items-center justify-between max-w-[280px] mx-auto mb-6 relative">
                  <div className="absolute top-2.5 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
                  
                  {/* Step 1 */}
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex flex-col items-center relative z-10 cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        currentStep === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      1
                    </div>
                    <span className="text-[10px] font-semibold text-slate-800 mt-1">Add Cards</span>
                  </button>

                  {/* Step 2 */}
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex flex-col items-center relative z-10 cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        currentStep === 2
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      2
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">Review</span>
                  </button>

                  {/* Step 3 */}
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex flex-col items-center relative z-10 cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                      3
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 mt-1">Submit</span>
                  </button>
                </div>

                {/* 5 Card Thumbnails + Add More */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
                  <div className="w-13 h-18 rounded-lg border border-amber-300 bg-amber-50/70 p-1 flex flex-col justify-between shrink-0 shadow-2xs">
                    <span className="text-[10px] font-bold text-amber-800">🔥 PSA 9</span>
                    <span className="text-[8px] font-medium text-slate-700">Charizard</span>
                  </div>
                  <div className="w-13 h-18 rounded-lg border border-blue-300 bg-blue-50/70 p-1 flex flex-col justify-between shrink-0 shadow-2xs">
                    <span className="text-[10px] font-bold text-blue-800">⚡ Foil</span>
                    <span className="text-[8px] font-medium text-slate-700">Pikachu</span>
                  </div>
                  <div className="w-13 h-18 rounded-lg border border-purple-300 bg-purple-50/70 p-1 flex flex-col justify-between shrink-0 shadow-2xs">
                    <span className="text-[10px] font-bold text-purple-800">🐉 Secret</span>
                    <span className="text-[8px] font-medium text-slate-700">Blue-Eyes</span>
                  </div>
                  <div className="w-13 h-18 rounded-lg border border-cyan-300 bg-cyan-50/70 p-1 flex flex-col justify-between shrink-0 shadow-2xs">
                    <span className="text-[10px] font-bold text-cyan-800">💎 Rare</span>
                    <span className="text-[8px] font-medium text-slate-700">Mox Opal</span>
                  </div>
                  <div className="w-13 h-18 rounded-lg border border-emerald-300 bg-emerald-50/70 p-1 flex flex-col justify-between shrink-0 shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-800">🌿 VMAX</span>
                    <span className="text-[8px] font-medium text-slate-700">Rayquaza</span>
                  </div>
                  <div className="w-13 h-18 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:bg-slate-100 text-slate-500">
                    <Plus className="w-4 h-4 text-slate-400" />
                    <span className="text-[8px] font-semibold text-slate-600 mt-1">+ Add More</span>
                  </div>
                </div>

                {/* Bottom Bar: 12 cards added | Estimated Offer | Continue button */}
                <div className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900">12 cards added</div>
                    <div className="text-[10px] text-slate-500">
                      Pokémon (7) · Magic (3) · Yu-Gi-Oh! (2)
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400">Estimated Offer</div>
                      <div className="text-sm font-extrabold text-slate-900">£620 - £710</div>
                    </div>

                    <button
                      onClick={() => setCurrentStep(currentStep === 1 ? 2 : 1)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
