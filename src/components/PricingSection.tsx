/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, ArrowRight } from 'lucide-react';
import { PRICING } from '../siteConfig';

export default function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-24 bg-white scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-[12px] font-bold tracking-wider text-blue-700 uppercase">Pricing</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Simple, and free to start.</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">{PRICING.badge}</span>
            <p className="mt-4 text-5xl font-extrabold text-slate-900">{PRICING.price}</p>
            <p className="text-sm text-slate-600 mt-1">{PRICING.priceNote}</p>
            <p className="text-sm text-slate-600 mt-4">{PRICING.blurb}</p>
            <button
              onClick={onGetStarted}
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-lg shadow-sm cursor-pointer"
            >
              Create my buying page <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-3">
            {PRICING.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">{PRICING.footnote}</p>
      </div>
    </section>
  );
}
