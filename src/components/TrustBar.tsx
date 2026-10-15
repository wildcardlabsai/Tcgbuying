/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store, User, Layers, Settings2 } from 'lucide-react';

export default function TrustBar() {
  const items = [
    {
      icon: Store,
      label: 'Built for TCG dealers',
    },
    {
      icon: User,
      label: 'Your own buying portal',
    },
    {
      icon: Layers,
      label: 'Collection management',
    },
    {
      icon: Settings2,
      label: 'Designed around the buying process',
    },
  ];

  return (
    <section className="border-y border-slate-100 bg-white py-5 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:flex md:items-center md:justify-between gap-4 md:gap-6 text-slate-700 text-xs sm:text-[13.5px] font-medium">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center justify-between md:gap-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="leading-tight">{item.label}</span>
                </div>
                {idx < items.length - 1 && (
                  <div className="hidden md:block h-5 w-[1px] bg-slate-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
