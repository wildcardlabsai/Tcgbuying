/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight } from 'lucide-react';
import gradedCardsImg from '../assets/images/tcg_graded_slabs_1792012171009.jpg';

interface CtaBannerProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
}

export default function CtaBanner({ onGetStarted, onExploreFeatures }: CtaBannerProps) {
  return (
    <section className="bg-[#080e22] text-white relative overflow-hidden py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading and CTAs */}
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-[1.1] mb-5 text-white">
              Make buying collections <br />
              easier to manage.
            </h2>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl mb-9 leading-relaxed">
              Give your shop a more organised way to receive submissions, review
              collections and manage buying activity.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreFeatures}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold text-white bg-transparent hover:bg-white/5 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Explore the features</span>
              </button>
            </div>
          </div>

          {/* Right Column: Graded card slabs angled visual */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end mt-6 lg:mt-0">
            <div className="relative w-full max-w-[340px] sm:max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 sm:rotate-2 sm:hover:rotate-0 transition-transform duration-500">
              <img
                src={gradedCardsImg}
                alt="Graded trading cards in PSA slabs"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#080e22]/70 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
