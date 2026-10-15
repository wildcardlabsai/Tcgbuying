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
      'TCGBuyer gives your trading card shop its own online buying page. Collectors upload photos of their cards (or type a list), see an estimated offer based on your rates, and send you the collection. In your dashboard you review it, make an offer, and the collector accepts, counters or declines.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'TCGBuyer is free while it is in early access, and you do not need a card to sign up. If paid plans are introduced later, we will tell shops in advance.',
  },
  {
    question: 'Is it only for Pokémon cards?',
    answer:
      'Yes. TCGBuyer is built for Pokémon cards only, so card identification, set and number matching and prices are all tuned for the Pokémon TCG. Other games are not supported.',
  },
  {
    question: 'How accurate are the prices?',
    answer:
      'Prices are TCGplayer market prices, which are based on recent TCGplayer sales, with Cardmarket shown as a cross-check and a note when the two disagree. Each price shows its source and when it was last updated, and cards with several printings (holo, reverse holo, 1st edition) let the collector pick the right one. TCGplayer prices are not eBay sold prices, so in the dealer dashboard you can also check what a card (raw or graded) recently sold for on eBay, up to your monthly lookup allowance. You choose your percentage and condition adjustments, and you always confirm the final offer after seeing the cards. Graded cards are not auto-priced, so you set those yourself.',
  },
  {
    question: 'Can I make the page look like my shop?',
    answer:
      'Yes. You can add your logo, pick an accent colour, write a welcome message, add info sections (such as what you buy, how you pay and your postage policy) and show your address, phone, email and opening hours. The page lives at your own TCGBuyer link, which you can share anywhere. Custom domains are not available yet.',
  },
  {
    question: 'How does photo recognition work, and where does my data go?',
    answer:
      'When a collector uploads a photo, it is sent to an AI service that reads the card name, set and number. You can see exactly which service in our Privacy Policy. Collectors can also search by name if they prefer. Recognition is a helper: the collector can correct a match and you check everything before making an offer.',
  },
  {
    question: 'Do collectors need an account?',
    answer:
      'No. They can submit without one and track their submission with a reference. If they create an account (email or Google) they can see all their submissions and offers in one place.',
  },
  {
    question: 'Do I need any technical knowledge?',
    answer:
      'No. Your page is hosted for you. Create your account, set your rates, and share the link on your website, Instagram, Facebook or Discord.',
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
