/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, ExternalLink } from 'lucide-react';
import { PRICING, SAMPLE_SHOP_URL } from '../siteConfig';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          <div className="lg:col-span-5 max-w-xl">
            <span className="inline-block mb-3 sm:mb-4 text-[11px] sm:text-[12px] font-bold tracking-wider text-blue-700 uppercase">
              Online buying pages for trading card shops
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-slate-900 tracking-tight leading-[1.08] mb-4 sm:mb-6">
              Let collectors sell you their cards online.{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                You make the offer.
              </span>
            </h1>

            <p className="text-base lg:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-8">
              Get your own buying page in minutes. Collectors upload photos, TCGBuyer identifies the cards and estimates a price from <em className="not-italic font-semibold text-slate-800">your</em> rates. You review it, make an offer and get paid.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap active:scale-[0.99]"
              >
                <span>Create my buying page</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={SAMPLE_SHOP_URL}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-[15px] font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>See a sample buying page</span>
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </a>
            </div>

            <p className="text-sm text-slate-600">
              {PRICING.price} {PRICING.priceNote} · No card needed
            </p>
          </div>

          {/* Real product screenshots: the dealer dashboard and a collector's phone view */}
          <div className="lg:col-span-7 relative">
            <div className="relative mx-auto max-w-[680px] lg:max-w-none pb-6 sm:pb-0 sm:pr-24 lg:pr-28">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-900">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <img
                  src="/screens/dealer-dashboard.webp"
                  alt="The TCGBuyer dealer dashboard: a queue of collector submissions with the selected submission's offer and cards"
                  width={1600}
                  height={978}
                  className="w-full h-auto block"
                  fetchPriority="high"
                />
              </div>

              <div className="hidden sm:block absolute -right-0 bottom-[-24px] w-[190px] lg:w-[220px] rounded-[26px] bg-slate-900 p-2 shadow-2xl border border-slate-700 rotate-2">
                <div className="rounded-[20px] overflow-hidden h-[340px] lg:h-[400px] bg-slate-900">
                  <img
                    src="/screens/buying-page-mobile.webp"
                    alt="A shop's buying page on a phone, with welcome message and info sections"
                    width={560}
                    height={1204}
                    loading="lazy"
                    className="w-full h-auto block"
                  />
                </div>
              </div>
            </div>
            <p className="mt-3 sm:mt-8 text-[11px] text-slate-500 text-center sm:text-left">
              Real screens from TCGBuyer, shown with sample data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
