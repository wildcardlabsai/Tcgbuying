/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink, Check } from 'lucide-react';
import { SAMPLE_SHOP_URL } from '../siteConfig';

const POINTS = [
  'Upload photos or a binder page, or type a list',
  'See an estimated offer straight away, in their own currency',
  'Send the collection and track it with a reference',
  'Accept, counter or decline when you make your offer',
];

export default function CollectorSideSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-xl">
          <span className="text-[12px] font-bold tracking-wider text-blue-700 uppercase">The collector&rsquo;s side</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            See what your customers see.
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Selling cards should feel easy, or collectors will go to whoever makes it easier. Your buying page walks them through it step by step on any phone.
          </p>
          <ul className="space-y-3 mb-8">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <a
            href={SAMPLE_SHOP_URL}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-[15px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            See a sample buying page
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="flex justify-center">
          <div className="w-[260px] sm:w-[290px] rounded-[34px] bg-slate-900 p-2.5 shadow-2xl border border-slate-700">
            <div className="rounded-[26px] overflow-hidden h-[520px] bg-slate-900">
              <img
                src="/screens/buying-page-mobile.webp"
                alt="A shop's buying page on a phone"
                width={560}
                height={1204}
                loading="lazy"
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
