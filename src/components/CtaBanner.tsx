/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight } from 'lucide-react';
import { SAMPLE_SHOP_URL } from '../siteConfig';

interface CtaBannerProps {
  onGetStarted: () => void;
  onExploreFeatures?: () => void;
}

export default function CtaBanner({ onGetStarted }: CtaBannerProps) {
  return (
    <section className="bg-[#080e22] text-white relative overflow-hidden py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-10 items-center">
          
          {/* Left Column: Heading and CTAs */}
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-[1.1] mb-5 text-white">
              Ready to buy more <br />
              collections?
            </h2>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl mb-9 leading-relaxed">
              Set up your buying page in minutes and start receiving submissions from collectors who would otherwise sell somewhere else.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Create my buying page</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={SAMPLE_SHOP_URL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold text-white bg-transparent hover:bg-white/5 border border-slate-600 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>See a sample buying page</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
