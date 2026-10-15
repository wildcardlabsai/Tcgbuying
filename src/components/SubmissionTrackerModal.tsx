/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Shield,
  ArrowRight,
  DollarSign,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Printer,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { updateSubmissionStatus, LiveSubmission } from '../services/dealerSubmissionService';
import PrintableManifestModal from './PrintableManifestModal';
import ConditionGuideModal from './ConditionGuideModal';

interface SubmissionTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRef?: string;
  submissions: LiveSubmission[];
}

export default function SubmissionTrackerModal({
  isOpen,
  onClose,
  initialRef = '#TCG-1046',
  submissions,
}: SubmissionTrackerModalProps) {
  const [searchRef, setSearchRef] = useState(initialRef);
  const [activeSub, setActiveSub] = useState<LiveSubmission | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [showConditionGuide, setShowConditionGuide] = useState(false);

  // Counter-offer form state
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [counterSubmitted, setCounterSubmitted] = useState(false);

  // Search or set active submission
  const currentSubmission =
    activeSub ||
    submissions.find((s) => s.ref.toLowerCase() === searchRef.trim().toLowerCase()) ||
    submissions[0];

  if (!isOpen) return null;

  const handleAccept = async (type: 'cash' | 'credit') => {
    if (currentSubmission) {
      await updateSubmissionStatus(
        currentSubmission.id || '1046',
        'Accepted',
        currentSubmission.offeredAmount || currentSubmission.estValue,
        `Collector accepted official ${type.toUpperCase()} offer.`
      );
      setIsSuccess(true);
    }
  };

  const handleSendCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubmission || !counterAmount.trim()) return;

    await updateSubmissionStatus(
      currentSubmission.id || '1046',
      'Review',
      counterAmount,
      `Collector Counter-Offer: ${counterAmount}. Note: "${counterNote}"`
    );

    setCounterSubmitted(true);
    setShowCounterForm(false);
  };

  const handleDecline = async () => {
    if (!currentSubmission) return;
    if (confirm('Are you sure you want to decline this offer? Your collection will be safely returned via fully insured tracked shipping.')) {
      await updateSubmissionStatus(
        currentSubmission.id || '1046',
        'Declined',
        undefined,
        'Collector declined offer. Free insured return requested.'
      );
      alert('Offer declined. The shop has been notified to return your parcel at zero cost to you.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Header */}
          <div className="bg-[#0b1329] text-white p-4 sm:px-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Track Your Card Submission</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConditionGuide(true)}
                className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                title="View Condition Standards"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Grading Guide</span>
              </button>

              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            {/* Search by Reference bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchRef}
                  onChange={(e) => {
                    setSearchRef(e.target.value);
                    const found = submissions.find(
                      (s) => s.ref.toLowerCase() === e.target.value.trim().toLowerCase()
                    );
                    if (found) setActiveSub(found);
                  }}
                  placeholder="Enter Reference (e.g. #TCG-1046)..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  const found = submissions.find(
                    (s) => s.ref.toLowerCase() === searchRef.trim().toLowerCase()
                  );
                  if (found) setActiveSub(found);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer shrink-0"
              >
                Lookup
              </button>
            </div>

            {currentSubmission ? (
              <div className="space-y-4">
                {/* Reference banner & Status */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-base font-extrabold text-slate-900 block">
                      {currentSubmission.ref}
                    </span>
                    <span className="text-xs text-slate-500">
                      {currentSubmission.collection} · {currentSubmission.cards} cards submitted
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentSubmission.status === 'Review' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> In Dealer Review
                      </span>
                    )}
                    {currentSubmission.status === 'Offer Sent' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                        <Send className="w-3.5 h-3.5" /> Official Offer Ready!
                      </span>
                    )}
                    {currentSubmission.status === 'Accepted' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Offer Accepted
                      </span>
                    )}
                    {currentSubmission.status === 'Completed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Payout Completed
                      </span>
                    )}
                    {currentSubmission.status === 'Declined' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                        <RotateCcw className="w-3.5 h-3.5" /> Return In Transit
                      </span>
                    )}
                    {currentSubmission.status === 'New' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        <Clock className="w-3.5 h-3.5" /> Queued for Intake
                      </span>
                    )}

                    {/* Print Packing Slip Button */}
                    <button
                      onClick={() => setShowManifestModal(true)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1"
                      title="Print Packing Slip & QR Manifest"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Slip</span>
                    </button>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="relative py-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submitted</span>
                    </div>
                    <div className="h-0.5 flex-1 mx-2 bg-slate-200" />
                    <div
                      className={`flex items-center gap-1.5 ${
                        currentSubmission.status !== 'New' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Appraised</span>
                    </div>
                    <div className="h-0.5 flex-1 mx-2 bg-slate-200" />
                    <div
                      className={`flex items-center gap-1.5 ${
                        ['Offer Sent', 'Accepted', 'Completed'].includes(currentSubmission.status)
                          ? 'text-blue-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Offer Ready</span>
                    </div>
                    <div className="h-0.5 flex-1 mx-2 bg-slate-200" />
                    <div
                      className={`flex items-center gap-1.5 ${
                        currentSubmission.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Paid</span>
                    </div>
                  </div>
                </div>

                {/* Offer Decision & Negotiation Box */}
                {['Offer Sent', 'Accepted', 'Completed'].includes(currentSubmission.status) && (
                  <div className="p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl border border-blue-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider block">
                          Official Store Offer
                        </span>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                          {currentSubmission.offeredAmount || currentSubmission.estValue}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Or Store Credit</span>
                        <span className="text-base font-bold text-emerald-700">
                          +15% Extra Bonus
                        </span>
                      </div>
                    </div>

                    {currentSubmission.dealerOfferNotes && (
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100 text-xs text-slate-700">
                        <span className="font-bold text-slate-900 block mb-0.5">Staff Inspection Note:</span>
                        <p className="italic text-slate-600">"{currentSubmission.dealerOfferNotes}"</p>
                      </div>
                    )}

                    {isSuccess || currentSubmission.status === 'Accepted' ? (
                      <div className="p-3.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-900 space-y-2">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>You Accepted this Offer!</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          The dealer has been notified to release funds to your registered bank account / PayPal or credit voucher.
                        </p>
                      </div>
                    ) : currentSubmission.status === 'Completed' ? (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                        Payment completed. Thank you for doing business with us!
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {/* 3 Main Action Choices */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleAccept('cash')}
                            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Accept Cash ({currentSubmission.offeredAmount || currentSubmission.estValue})</span>
                          </button>
                          <button
                            onClick={() => handleAccept('credit')}
                            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Accept Store Credit</span>
                          </button>
                        </div>

                        {/* Counter-Offer or Decline Row */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/60">
                          <button
                            type="button"
                            onClick={() => setShowCounterForm(!showCounterForm)}
                            className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Propose Counter-Offer</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleDecline}
                            className="text-slate-500 hover:text-red-600 flex items-center gap-1"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Decline & Request Free Return</span>
                          </button>
                        </div>

                        {/* Interactive Counter-Offer Form */}
                        {showCounterForm && (
                          <form onSubmit={handleSendCounterOffer} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 mt-2 animate-in fade-in">
                            <span className="text-xs font-bold text-slate-900 block">
                              Propose Your Counter-Offer:
                            </span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                required
                                value={counterAmount}
                                onChange={(e) => setCounterAmount(e.target.value)}
                                placeholder="e.g. £1,200"
                                className="w-28 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                              />
                              <input
                                type="text"
                                value={counterNote}
                                onChange={(e) => setCounterNote(e.target.value)}
                                placeholder="Reason (e.g. Charizard is pack-fresh NM)"
                                className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                              />
                              <button
                                type="submit"
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                              >
                                Send
                              </button>
                            </div>
                          </form>
                        )}

                        {counterSubmitted && (
                          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-semibold">
                            ✓ Your counter-offer has been sent to the shop owner for review!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 100% Risk-Free Guarantee Banner */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-950">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>100% Risk-Free Guarantee:</strong> If you decline an offer after our in-person card inspection, we safely return your collection with fully insured tracked postage at zero cost.
                  </p>
                </div>

                {/* Collector Details Note */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-800 block">Submission Summary:</span>
                  <p>"{currentSubmission.notes}"</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No submission found with that reference. Please check your tracking number.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            {currentSubmission && (
              <button
                onClick={() => setShowManifestModal(true)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Packing Slip</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Manifest Modal */}
      <PrintableManifestModal
        isOpen={showManifestModal}
        onClose={() => setShowManifestModal(false)}
        submission={currentSubmission}
      />

      {/* Condition Guide Modal */}
      <ConditionGuideModal
        isOpen={showConditionGuide}
        onClose={() => setShowConditionGuide(false)}
      />
    </>
  );
}
