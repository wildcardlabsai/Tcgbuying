/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Printer, Package, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';
import { LiveSubmission } from '../services/dealerSubmissionService';

interface PrintableManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: LiveSubmission | null;
  shopName?: string;
}

export default function PrintableManifestModal({
  isOpen,
  onClose,
  submission,
  shopName = 'The Card Vault',
}: PrintableManifestModalProps) {
  if (!isOpen || !submission) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalMarket = (submission.items || []).reduce((acc, c) => acc + (c.marketPrice || 0), 0);
  const totalOffer = submission.offeredAmount || (submission.totalCashOffer ? `£${submission.totalCashOffer}` : submission.estValue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white animate-in fade-in">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full">
        
        {/* On-Screen Action Bar (Hidden during print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Printable Intake Manifest & Packing Slip
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest (A4 / Letter)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="p-6 sm:p-10 space-y-6 print:p-6" id="printable-manifest">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Logo size="sm" />
                <span className="text-slate-400 text-sm">|</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Official Buylist Intake Slip
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-950">{shopName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Trading Card Game Buylist Department • Licensed TCG Specialist
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Intake Reference
              </span>
              <span className="text-2xl font-mono font-black text-blue-600 block">
                {submission.ref}
              </span>
              <span className="text-xs text-slate-500">Date: {submission.date}</span>
            </div>
          </div>

          {/* Quick Check-in QR & Barcode Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Synthetic Visual QR Code */}
              <div className="w-20 h-20 bg-white p-1.5 rounded-lg border border-slate-300 shrink-0 flex items-center justify-center shadow-xs">
                <div className="w-full h-full border-2 border-slate-900 p-1 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-3.5 h-3.5 bg-slate-950" />
                    <div className="w-3.5 h-3.5 bg-slate-950" />
                  </div>
                  <div className="flex items-center justify-center font-mono text-[8px] font-bold text-slate-900">
                    SCAN
                  </div>
                  <div className="flex justify-between">
                    <div className="w-3.5 h-3.5 bg-slate-950" />
                    <div className="w-2 h-2 bg-slate-950" />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  Automated Warehouse / Counter Scan
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Dealer staff: Scan this QR code or enter <strong className="text-slate-900">{submission.ref}</strong> into the intake terminal to pull up submission cards.
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Insured Package Tracking Active</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Payout</span>
              <span className="text-xl font-black text-slate-950 block">{totalOffer}</span>
              <span className="text-[11px] text-slate-500 font-medium">
                Method: {submission.preferredPayout?.toUpperCase() || 'CASH'}
              </span>
            </div>
          </div>

          {/* Collector & Fulfillment Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-3 space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                Collector Information
              </span>
              <p className="font-bold text-slate-900 text-sm">{submission.collector}</p>
              <p className="text-slate-600">Email: {submission.email}</p>
              <p className="text-slate-600">Phone: {submission.phone || 'Not provided'}</p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                Destination Shop Address
              </span>
              <p className="font-bold text-slate-900 text-sm">{shopName} Buylist Vault</p>
              <p className="text-slate-600">Unit 4, High Street Retail Arcade</p>
              <p className="text-slate-600">London, United Kingdom • Ref: {submission.ref}</p>
            </div>
          </div>

          {/* Itemized Card Manifest Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Itemized Cards Manifest ({submission.items?.length || 0} cards)
              </span>
              <span className="text-xs text-slate-500">
                Verified against official TCG database
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Card Description</th>
                    <th className="py-2.5 px-3">Game & Set</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3 text-right">Est. Market</th>
                    <th className="py-2.5 px-3 text-right">Offer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(submission.items || []).map((card, idx) => (
                    <tr key={card.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {card.name}
                        {card.cardNumber && (
                          <span className="ml-1 text-slate-500 font-mono text-[10px]">
                            #{card.cardNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {card.game} • {card.setName}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {card.condition}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        £{card.marketPrice || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        £{card.cashOffer || card.marketPrice || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Packing Instructions for Collector */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              Packaging & Shipping Instructions
            </span>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 leading-relaxed">
              <li>Place cards inside protective penny sleeves and top loaders or semi-rigid holders.</li>
              <li>Sandwich cards between two pieces of rigid cardboard and seal with painter's tape.</li>
              <li>Include this printed slip inside the parcel so our intake team can verify your collection immediately upon arrival.</li>
              <li>Affix your tracked prepaid mailing label to the outside of the bubble mailer.</li>
            </ol>
          </div>

          {/* Footer Sign-off */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>TCGBuyer Certified Buylist Platform</span>
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
