/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScanLine, Percent, Palette, ClipboardList, Coins, Printer } from 'lucide-react';

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Photo card recognition',
    body: 'Collectors photograph a card or a whole binder page. TCGBuyer reads the name, set and collector number and finds the matching card, so nobody types out a list.',
  },
  {
    icon: Percent,
    title: 'Your rates, not ours',
    body: 'Set your cash and store-credit percentages, plus flat per-card rates for commons, holos, ultra rares and sealed packs. Collectors see offers built from your numbers.',
  },
  {
    icon: Palette,
    title: 'A page that looks like your shop',
    body: 'Add your logo, colour, a welcome message and info sections like "What we buy" and "How we pay", plus your address and opening hours.',
  },
  {
    icon: ClipboardList,
    title: 'Offers and tracking',
    body: 'Review each submission, send an offer and see whether the collector accepts, counters or declines. Every submission has a reference they can track.',
  },
  {
    icon: Coins,
    title: 'Pounds, euros or dollars',
    body: 'Show prices in GBP, EUR or USD using current exchange rates. Set your shop’s default and collectors can switch to theirs.',
  },
  {
    icon: Printer,
    title: 'Packing slips and accounts',
    body: 'Print a packing slip with a QR code for each parcel. Collectors can create an account to follow their offers across every shop they sell to.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-slate-50 border-b border-slate-100 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <span className="text-[12px] font-bold tracking-wider text-blue-700 uppercase">What you get</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Everything you need to buy collections online.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
