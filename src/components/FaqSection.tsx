/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'What is TCGBuyer?',
    answer:
      'TCGBuyer is specialized software designed specifically for independent trading card game shops and hobby dealers. It gives your store a custom online buying portal where customers can submit their cards and collections for appraisal, while providing your staff with a unified dealer dashboard to review submissions, estimate card values, generate offers, and manage payouts all in one organised place.',
  },
  {
    question: 'Which trading card games does TCGBuyer support?',
    answer:
      'TCGBuyer supports all major collectible trading card games including Pokémon TCG, Magic: The Gathering (MTG), Yu-Gi-Oh!, One Piece Card Game, Disney Lorcana, Flesh and Blood, Digimon, Dragon Ball Super, and sports cards (Topps, Panini, Bowman). You can easily toggle which games your specific store buys.',
  },
  {
    question: 'How does the customer submission process work?',
    answer:
      'Collectors visit your dedicated online portal (e.g., cards.yourstore.com or your customized link). They can upload photos of individual cards or binder pages, specify conditions, and see an estimated preliminary offer range based on your custom buying formula. Once submitted, the collection immediately appears in your dealer dashboard for review.',
  },
  {
    question: 'Can I customise the buying portal with my own branding?',
    answer:
      'Yes, absolutely. You can upload your store logo, match your brand colors, set custom buying policies, add your physical store address for drop-offs, and configure custom payout options (such as Cash, Bank Transfer / Faster Payments, PayPal, or In-Store Credit with optional trade-in bonuses).',
  },
  {
    question: 'Is there a cost to get started?',
    answer:
      'You can start with a 14-day free trial without requiring a credit card. After that, we offer transparent monthly and annual plans tailored for both single brick-and-mortar hobby shops and multi-location TCG operations with no hidden transaction fees on purchases.',
  },
  {
    question: 'Do I need any technical knowledge to use TCGBuyer?',
    answer:
      'None at all. Your buying portal is hosted and secured automatically with zero code required. You can share your custom link on your website, Instagram, Facebook, and Discord, or even print the provided QR code to place on your physical shop counter.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="text-[12px] font-bold tracking-wider text-blue-600 uppercase mb-3 block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion List */}
        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="py-5 transition-colors">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left font-semibold text-slate-900 hover:text-blue-600 transition-colors py-1 cursor-pointer focus-visible:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg pr-4">{faq.question}</span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 shrink-0">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-slate-700" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-700" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="pt-3 pb-2 text-slate-600 text-sm sm:text-[15px] leading-relaxed animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
