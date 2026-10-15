/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface ConditionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConditionGuideModal({ isOpen, onClose }: ConditionGuideModalProps) {
  if (!isOpen) return null;

  const conditions = [
    {
      title: 'Near Mint (NM / Raw NM)',
      badge: 'Near Mint',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      payoutPercent: '100% of Buylist Rate',
      summary: 'Pack fresh to minimal handling. Clean surface with crisp corners.',
      points: [
        'Surface is glossy and free of deep scratches or scuffs.',
        'Maximum 1 to 2 micro whitening specks along back border edges.',
        'Sharp corners with no fraying, peeling, or bends.',
        'Foil is vibrant without clouding or indentation.',
      ],
      sampleImage: 'https://images.pokemontcg.io/base1/4_hires.png',
    },
    {
      title: 'Lightly Played (LP)',
      badge: 'Lightly Played',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      payoutPercent: '80% - 85% of NM Rate',
      summary: 'Minor border wear or faint surface marks from light play or binder storage.',
      points: [
        'Small amounts of white showing along back or side edges.',
        'Light surface scuffing visible under angled light.',
        'Corners may show slight softening without creasing.',
        'Card remains 100% tournament legal and highly collectible.',
      ],
      sampleImage: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    },
    {
      title: 'Moderately Played (MP)',
      badge: 'Moderately Played',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      payoutPercent: '60% - 65% of NM Rate',
      summary: 'Visible wear throughout. Obvious edge whitening or foil scratches.',
      points: [
        'Moderate whitening across multiple borders and corners.',
        'Visible scratches across holographic surface.',
        'May have mild corner softening or slight binder indentation.',
        'No major structural creases or ink/water damage.',
      ],
      sampleImage: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
    },
    {
      title: 'Heavily Played (HP) / Damaged (DMG)',
      badge: 'Heavily Played',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      payoutPercent: '25% - 40% of NM Rate',
      summary: 'Significant wear, creases, surface peeling, or liquid exposure.',
      points: [
        'Severe edge wear, deep creases, or heavy whitening.',
        'Clouded foil, surface indentation, or discoloration.',
        'Damaged cards are evaluated on a case-by-case basis.',
      ],
      sampleImage: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
    },
    {
      title: 'Graded Slabs (PSA 10 / BGS 9.5 / CGC 10)',
      badge: 'Graded Gem Mint',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      payoutPercent: '200% - 400%+ of Raw Rate',
      summary: 'Encapsulated in sonically sealed acrylic holder with official grading certificate.',
      points: [
        'Must be intact with zero cracks, tampering, or broken labels.',
        'Serial number and barcode verified against third-party registry.',
        'Premium cash payouts for high-grade PSA 10, PSA 9, and BGS 9.5 slabs.',
      ],
      sampleImage: 'https://images.pokemontcg.io/swsh12pt5/160_hires.png',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="bg-[#0b1329] px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">Visual Card Condition & Grading Guide</h3>
              <p className="text-xs text-slate-400">
                How our shop inspects and grades trading cards to ensure fair, transparent payouts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {conditions.map((c) => (
            <div
              key={c.title}
              className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.badgeColor}`}>
                    {c.badge}
                  </span>
                  <h4 className="text-sm font-bold text-white">{c.title}</h4>
                </div>

                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {c.payoutPercent}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div className="sm:col-span-1 shrink-0 flex justify-center">
                  <img
                    src={c.sampleImage}
                    alt={c.title}
                    className="w-16 h-24 object-cover rounded-lg border border-slate-700 shadow-md"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <p className="text-xs text-slate-300 font-medium">{c.summary}</p>
                  <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                    {c.points.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Questions? All conditions are verified side-by-side upon card arrival.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}
