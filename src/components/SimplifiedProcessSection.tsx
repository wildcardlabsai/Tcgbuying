/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UploadCloud, FolderKanban, Sliders } from 'lucide-react';
import gradedCardsImg from '../assets/images/tcg_graded_slabs_1792012171009.jpg';

export default function SimplifiedProcessSection() {
  const features = [
    {
      num: '01',
      icon: UploadCloud,
      title: 'Give collectors a clear place to sell',
      description:
        'Give customers a dedicated online destination where they can submit their cards to your shop.',
    },
    {
      num: '02',
      icon: FolderKanban,
      title: 'Keep submissions organised',
      description:
        'Review incoming collections, track progress and keep buying activity in one place.',
    },
    {
      num: '03',
      icon: Sliders,
      title: 'Stay in control of your offers',
      description:
        "Build a buying workflow around your shop's own approach to pricing and purchasing.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Heading, description, and 3 feature blocks */}
          <div className="lg:col-span-7">
            <span className="text-[12px] font-bold tracking-wider text-blue-600 uppercase mb-3 block">
              THE BUYING PROCESS, SIMPLIFIED
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-5">
              Buying collections <br />
              shouldn’t mean <br />
              juggling everything else.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-10 max-w-2xl">
              Between incoming enquiries, card lists, pricing, offers and customer messages,
              buying collections can quickly become difficult to manage. TCGBuyer is designed to
              bring that process into one organised workflow.
            </p>

            {/* 3 cards with 01, 02, 03 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {features.map((item) => (
                <div
                  key={item.num}
                  className="p-5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header with pill number & blue square icon */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {item.num}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center border border-blue-100/60">
                        <item.icon className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-[14px] mb-2 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual photo of graded card slabs with Pikachu */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
              <img
                src={gradedCardsImg}
                alt="Graded Pokemon and collectible trading cards in PSA acrylic slabs on store counter"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover transform group-hover:scale-102 transition-transform duration-700 aspect-[4/3]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
