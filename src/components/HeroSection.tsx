/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowRight,
  Play,
  Search,
  Plus,
  CloudUpload,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import Logo from './Logo';
import heroCardsBg from '../assets/images/tcg_hero_cards_spread_1792012171596.jpg';

interface HeroSectionProps {
  onGetStarted: () => void;
  onSeeHowItWorks: () => void;
  onOpenSubmissionDemo?: (id: string) => void;
}

export default function HeroSection({
  onGetStarted,
  onSeeHowItWorks,
  onOpenSubmissionDemo,
}: HeroSectionProps) {
  return (
    <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Headline and Call-to-actions */}
          <div className="lg:col-span-5 max-w-xl">
            <div className="inline-block mb-3 sm:mb-4">
              <span className="text-[11px] sm:text-[12px] font-bold tracking-wider text-blue-600 uppercase">
                TCG BUYING SOFTWARE FOR DEALERS
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-extrabold text-slate-900 tracking-tight leading-[1.08] mb-4 sm:mb-6">
              Your next <br />
              collection <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                starts here.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-8">
              TCGBuyer gives trading card shops their own online buying portal, making
              it easier for collectors to submit cards and for dealers to manage the
              buying process from one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-[14px] sm:text-[15px] font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap active:scale-[0.99]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onSeeHowItWorks}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 text-[14px] sm:text-[15px] font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Play className="w-2.5 h-2.5 fill-slate-800 text-slate-800 ml-0.5" />
                </div>
                <span>See How It Works</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Built for the shops that buy cards.
            </p>
          </div>

          {/* Right Column: Tablet Frame Mockup + Overlapping Submission Widget */}
          <div className="lg:col-span-7 relative w-full overflow-visible">
            <div className="relative mx-auto max-w-[640px] lg:max-w-none">
              
              {/* Photorealistic Pokemon card booster packs in background (hidden on mobile to prevent overflow) */}
              <div className="hidden sm:block absolute -bottom-10 -left-6 w-72 h-44 rounded-2xl overflow-hidden opacity-30 pointer-events-none -rotate-6 blur-[1px] -z-0">
                <img
                  src={heroCardsBg}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Tablet Frame with Dark Bezel & Camera Notch */}
              <div className="relative z-10 bg-slate-900 p-1.5 sm:p-2.5 rounded-[22px] sm:rounded-[28px] shadow-2xl border-2 sm:border-4 border-slate-800">
                
                {/* Top Camera Notch */}
                <div className="hidden sm:flex absolute top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-1.5 bg-slate-950 rounded-full items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                </div>

                {/* Tablet Screen Content */}
                <div className="bg-white rounded-[16px] sm:rounded-[20px] overflow-hidden flex flex-col text-slate-900 border border-slate-200">
                  
                  {/* Screen Header Bar */}
                  <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 border-b border-slate-100 bg-white gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <Logo size="sm" />
                    </div>

                    <div className="flex-1 max-w-[140px] sm:max-w-xs">
                      <div className="relative">
                        <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search..."
                          className="w-full bg-slate-50 text-slate-700 pl-6 sm:pl-8 pr-2 py-1 rounded-md text-[10px] sm:text-[11px] placeholder:text-slate-400 focus:outline-none border border-slate-200"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-blue-600 text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center">
                        TV
                      </div>
                      <div className="text-left hidden md:block">
                        <div className="text-[11px] font-semibold text-slate-800 leading-none flex items-center gap-1">
                          <span>The Card Vault</span>
                          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                        </div>
                        <div className="text-[9px] text-slate-400">Dealer Account</div>
                      </div>
                    </div>
                  </div>

                  {/* Tablet Body: Dark Sidebar + White Table Content */}
                  <div className="flex min-h-[300px] sm:min-h-[350px]">
                    {/* Left Dark Sidebar: Compact icon bar on mobile, full on sm+ */}
                    <div className="w-10 sm:w-36 bg-[#090f20] p-1.5 sm:p-2.5 flex flex-col gap-1 text-[11px] text-slate-400 shrink-0">
                      <div className="p-1.5 sm:px-2 sm:py-1.5 rounded text-slate-400 hover:bg-slate-800/50 flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs">📊</span>
                        <span className="hidden sm:inline">Dashboard</span>
                      </div>
                      <div className="p-1.5 sm:px-2 sm:py-1.5 rounded bg-blue-600/25 text-blue-400 font-semibold flex items-center justify-center sm:justify-start gap-2 border border-blue-500/30">
                        <span className="text-xs">📥</span>
                        <span className="hidden sm:inline">Submissions</span>
                      </div>
                      <div className="p-1.5 sm:px-2 sm:py-1.5 rounded text-slate-400 hover:bg-slate-800/50 flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs">🏷️</span>
                        <span className="hidden sm:inline">Offers</span>
                      </div>
                      <div className="p-1.5 sm:px-2 sm:py-1.5 rounded text-slate-400 hover:bg-slate-800/50 flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs">📦</span>
                        <span className="hidden sm:inline">Purchases</span>
                      </div>
                      <div className="p-1.5 sm:px-2 sm:py-1.5 rounded text-slate-400 hover:bg-slate-800/50 flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs">👥</span>
                        <span className="hidden sm:inline">Customers</span>
                      </div>
                    </div>

                    {/* Main White Table Content */}
                    <div className="flex-1 p-2 sm:p-4 bg-white overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Submissions</h4>
                          {/* Filter pills */}
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-[9px] sm:text-[10px]">
                            <span className="px-1.5 sm:px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold border border-blue-200 whitespace-nowrap">
                              All 142
                            </span>
                            <span className="px-1.5 sm:px-2 py-0.5 text-slate-600 hover:bg-slate-50 rounded whitespace-nowrap">
                              New 10
                            </span>
                            <span className="px-1.5 sm:px-2 py-0.5 text-slate-600 hover:bg-slate-50 rounded whitespace-nowrap">
                              Review 8
                            </span>
                            <span className="px-1.5 sm:px-2 py-0.5 text-slate-600 hover:bg-slate-50 rounded whitespace-nowrap">
                              Offer Sent 6
                            </span>
                          </div>
                        </div>

                        {/* Submissions Table with mobile-optimized columns */}
                        <div className="w-full overflow-x-auto no-scrollbar">
                          <table className="w-full text-left text-[10px] sm:text-[11px]">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-100 text-[9px] sm:text-[10px]">
                                <th className="pb-1.5 font-medium">Ref</th>
                                <th className="pb-1.5 font-medium hidden sm:table-cell">Date</th>
                                <th className="pb-1.5 font-medium">Collection</th>
                                <th className="pb-1.5 font-medium hidden md:table-cell">Cards</th>
                                <th className="pb-1.5 font-medium">Est.</th>
                                <th className="pb-1.5 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              <tr
                                onClick={() => onOpenSubmissionDemo && onOpenSubmissionDemo('TCG-1047')}
                                className="hover:bg-slate-50 cursor-pointer"
                              >
                                <td className="py-1.5 sm:py-2 font-medium text-slate-900">#1047</td>
                                <td className="py-1.5 sm:py-2 text-slate-500 text-[9px] hidden sm:table-cell">12 Oct</td>
                                <td className="py-1.5 sm:py-2 truncate max-w-[80px] sm:max-w-none">Mixed TCG</td>
                                <td className="py-1.5 sm:py-2 hidden md:table-cell">142</td>
                                <td className="py-1.5 sm:py-2 font-semibold text-slate-900">£1,240</td>
                                <td className="py-1.5 sm:py-2">
                                  <span className="inline-block px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-semibold text-amber-600 bg-amber-50 rounded border border-amber-200">
                                    Review
                                  </span>
                                </td>
                              </tr>

                              <tr
                                onClick={() => onOpenSubmissionDemo && onOpenSubmissionDemo('TCG-1046')}
                                className="hover:bg-slate-50 cursor-pointer"
                              >
                                <td className="py-1.5 sm:py-2 font-medium text-slate-900">#1046</td>
                                <td className="py-1.5 sm:py-2 text-slate-500 text-[9px] hidden sm:table-cell">11 Oct</td>
                                <td className="py-1.5 sm:py-2">Pokémon</td>
                                <td className="py-1.5 sm:py-2 hidden md:table-cell">86</td>
                                <td className="py-1.5 sm:py-2 font-semibold text-slate-900">£820</td>
                                <td className="py-1.5 sm:py-2">
                                  <span className="inline-block px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-semibold text-indigo-600 bg-indigo-50 rounded border border-indigo-200 whitespace-nowrap">
                                    Offer Sent
                                  </span>
                                </td>
                              </tr>

                              <tr
                                onClick={() => onOpenSubmissionDemo && onOpenSubmissionDemo('TCG-1045')}
                                className="hover:bg-slate-50 cursor-pointer"
                              >
                                <td className="py-1.5 sm:py-2 font-medium text-slate-900">#1045</td>
                                <td className="py-1.5 sm:py-2 text-slate-500 text-[9px] hidden sm:table-cell">11 Oct</td>
                                <td className="py-1.5 sm:py-2 truncate max-w-[80px] sm:max-w-none">Magic</td>
                                <td className="py-1.5 sm:py-2 hidden md:table-cell">214</td>
                                <td className="py-1.5 sm:py-2 font-semibold text-slate-900">£1,650</td>
                                <td className="py-1.5 sm:py-2">
                                  <span className="inline-block px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-semibold text-purple-600 bg-purple-50 rounded border border-purple-200">
                                    New
                                  </span>
                                </td>
                              </tr>

                              <tr
                                onClick={() => onOpenSubmissionDemo && onOpenSubmissionDemo('TCG-1044')}
                                className="hover:bg-slate-50 cursor-pointer"
                              >
                                <td className="py-1.5 sm:py-2 font-medium text-slate-900">#1044</td>
                                <td className="py-1.5 sm:py-2 text-slate-500 text-[9px] hidden sm:table-cell">10 Oct</td>
                                <td className="py-1.5 sm:py-2">Yu-Gi-Oh!</td>
                                <td className="py-1.5 sm:py-2 hidden md:table-cell">57</td>
                                <td className="py-1.5 sm:py-2 font-semibold text-slate-900">£320</td>
                                <td className="py-1.5 sm:py-2">
                                  <span className="inline-block px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-semibold text-emerald-600 bg-emerald-50 rounded border border-emerald-200 whitespace-nowrap">
                                    Completed
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreground Floating Widget: Submit Your Cards */}
              <div className="w-full sm:w-[500px] lg:w-[520px] bg-white text-slate-900 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-slate-200 overflow-hidden sm:absolute sm:-left-6 sm:-bottom-10 lg:-left-12 lg:-bottom-12 mt-4 sm:mt-0 z-20">
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900">Submit Your Cards</h5>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                      Get a quick and fair offer for your cards. It's simple, secure and free to use.
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                  {/* Left Column: Upload box + Card Thumbnails */}
                  <div className="sm:col-span-7 space-y-2.5">
                    {/* Dotted upload dropzone */}
                    <div className="border border-dashed border-blue-200 rounded-xl p-2.5 sm:p-3 bg-blue-50/30 text-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-1">
                        <CloudUpload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold text-slate-800">
                        Upload photos of your cards
                      </div>
                      <div className="text-[9.5px] sm:text-[10px] text-slate-500 mt-0.5">
                        Drag and drop your images here, or click to browse
                      </div>
                      <div className="text-[8.5px] sm:text-[9px] text-slate-400 mt-0.5">
                        JPG, PNG or HEIC (Max 20MB each)
                      </div>
                    </div>

                    {/* 4 Card previews + Add box */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5">
                      <div className="w-10 h-14 sm:w-11 sm:h-15 rounded-md border border-amber-400 bg-amber-50 p-0.5 relative shadow-2xs overflow-hidden shrink-0">
                        <div className="w-full h-full rounded bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-xs">
                          🔥
                        </div>
                      </div>
                      <div className="w-10 h-14 sm:w-11 sm:h-15 rounded-md border border-blue-400 bg-blue-50 p-0.5 relative shadow-2xs overflow-hidden shrink-0">
                        <div className="w-full h-full rounded bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-xs">
                          ⚡
                        </div>
                      </div>
                      <div className="w-10 h-14 sm:w-11 sm:h-15 rounded-md border border-purple-400 bg-purple-50 p-0.5 relative shadow-2xs overflow-hidden shrink-0">
                        <div className="w-full h-full rounded bg-gradient-to-tr from-purple-600 to-pink-400 flex items-center justify-center text-xs">
                          🐉
                        </div>
                      </div>
                      <div className="w-10 h-14 sm:w-11 sm:h-15 rounded-md border border-emerald-400 bg-emerald-50 p-0.5 relative shadow-2xs overflow-hidden shrink-0">
                        <div className="w-full h-full rounded bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xs">
                          🌿
                        </div>
                      </div>
                      <div className="w-8 h-14 sm:w-8 sm:h-15 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 cursor-pointer shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Collection Summary & Submit button */}
                  <div className="sm:col-span-5 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-slate-100 pt-2.5 sm:pt-0 sm:pl-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-900">Collection Summary</span>
                        <span className="text-[9px] text-slate-400">Clear all</span>
                      </div>
                      <div className="text-[9.5px] sm:text-[10px] text-slate-500 mb-1.5">18 cards added</div>

                      <div className="space-y-1 text-[10.5px] sm:text-[11px]">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Pokémon</span>
                          </span>
                          <span className="font-semibold text-slate-900">£420</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>Magic</span>
                          </span>
                          <span className="font-semibold text-slate-900">£310</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span>Yu-Gi-Oh!</span>
                          </span>
                          <span className="font-semibold text-slate-900">£120</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <div className="bg-slate-50 rounded-lg p-1.5 sm:p-2 text-center border border-slate-100 mb-2">
                        <div className="text-[9px] text-slate-500 font-medium">Estimated Offer</div>
                        <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                          £850 – £950
                        </div>
                        <div className="text-[8px] text-slate-400">Final offer after review</div>
                      </div>

                      <button
                        onClick={onGetStarted}
                        className="w-full py-2 px-3 text-[11px] font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Submit Collection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
