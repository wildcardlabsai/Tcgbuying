/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  X,
  CheckCircle2,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import type { SubmissionRecord } from './DashboardWorkflowSection';
import Logo from './Logo';

/* =========================================================================
   1. GET STARTED / DEALER ONBOARDING MODAL
   ========================================================================= */
interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GetStartedModal({ isOpen, onClose }: GetStartedModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shopName, setShopName] = useState('The Card Vault');
  const [email, setEmail] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([
    'Pokémon TCG',
    'Magic: The Gathering',
    'Yu-Gi-Oh!',
  ]);
  const [subdomain, setSubdomain] = useState('thecardvault');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleGame = (game: string) => {
    if (selectedGames.includes(game)) {
      setSelectedGames(selectedGames.filter((g) => g !== game));
    } else {
      setSelectedGames([...selectedGames, game]);
    }
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              · Dealer Onboarding
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Your Buying Portal is Ready!</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              We've created your branded portal at{' '}
              <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                https://{subdomain || 'myshop'}.tcgbuyer.com
              </span>
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2">
              <div className="font-semibold text-slate-800">Next Steps:</div>
              <div className="text-slate-600 flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Check your inbox for your dashboard login credentials.
              </div>
              <div className="text-slate-600 flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Link your portal to your shop website or Instagram bio.
              </div>
              <div className="text-slate-600 flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Start receiving and appraising card submissions instantly.
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dealer Dashboard
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Steps tracker */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 text-xs font-semibold text-slate-400">
              <span className={step >= 1 ? 'text-blue-600' : ''}>1. Shop Details</span>
              <span>→</span>
              <span className={step >= 2 ? 'text-blue-600' : ''}>2. Games You Buy</span>
              <span>→</span>
              <span className={step >= 3 ? 'text-blue-600' : ''}>3. Launch Portal</span>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Shop or Business Name
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => {
                      setShopName(e.target.value);
                      setSubdomain(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '')
                          .slice(0, 18)
                      );
                    }}
                    placeholder="e.g. Apex Card Lounge"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dealer@yourshop.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Next: Select Games</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Which TCGs does your shop purchase?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      'Pokémon TCG',
                      'Magic: The Gathering',
                      'Yu-Gi-Oh!',
                      'One Piece TCG',
                      'Disney Lorcana',
                      'Graded Slabs & Sports',
                    ].map((game) => {
                      const isSelected = selectedGames.includes(game);
                      return (
                        <button
                          type="button"
                          key={game}
                          onClick={() => toggleGame(game)}
                          className={`p-2.5 text-left rounded-lg border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span>{game}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2"
                  >
                    <span>Next: Choose URL</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleFinish} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Shop's Buying Portal Address
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-300 overflow-hidden text-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <span className="bg-slate-100 px-3 py-2.5 text-slate-500 font-mono text-xs border-r border-slate-200">
                      https://
                    </span>
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-3 py-2.5 text-slate-900 font-semibold text-sm focus:outline-none"
                      required
                    />
                    <span className="bg-slate-100 px-3 py-2.5 text-slate-500 font-mono text-xs border-l border-slate-200">
                      .tcgbuyer.com
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    You can also connect your own custom domain (e.g. sell.thecardvault.co.uk) later.
                  </p>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>14-day free trial activated automatically. No credit card required.</span>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Launch Portal Now</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* =========================================================================
   2. SUBMISSION DETAIL INSPECTOR MODAL
   ========================================================================= */
interface SubmissionDetailModalProps {
  submission: SubmissionRecord | null;
  onClose: () => void;
  onStatusChange?: (ref: string, newStatus: 'Review' | 'Offer Sent' | 'Completed') => void;
}

export function SubmissionDetailModal({
  submission,
  onClose,
  onStatusChange,
}: SubmissionDetailModalProps) {
  const [offerValue, setOfferValue] = useState('£1,150');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!submission) return null;

  const handleSendOffer = () => {
    setSentSuccess(true);
    if (onStatusChange) {
      onStatusChange(submission.ref, 'Offer Sent');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#0b1329] text-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-700">
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090f20]">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-blue-400 text-base">{submission.ref}</span>
            <span className="text-xs text-slate-400">· Submitted {submission.date}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#121c38] p-3 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">Collector</span>
              <span className="text-xs font-semibold text-slate-200">{submission.collector}</span>
            </div>
            <div className="bg-[#121c38] p-3 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">Game Category</span>
              <span className="text-xs font-semibold text-slate-200">{submission.collection}</span>
            </div>
            <div className="bg-[#121c38] p-3 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">Card Count</span>
              <span className="text-xs font-semibold text-slate-200">{submission.cards} cards</span>
            </div>
            <div className="bg-[#121c38] p-3 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">Market Est. Value</span>
              <span className="text-xs font-bold text-emerald-400">{submission.estValue}</span>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Collector Submission Notes
            </h5>
            <div className="p-3 bg-[#121c38] rounded-lg border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
              "{submission.notes}"
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Appraisal & Official Store Offer
            </h5>
            <div className="p-4 bg-[#121c38] rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Offer Amount (£)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={offerValue}
                    onChange={(e) => setOfferValue(e.target.value)}
                    className="bg-[#090f20] text-slate-100 font-bold text-lg px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {sentSuccess ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Offer Sent to {submission.collector}!
                  </span>
                ) : (
                  <button
                    onClick={handleSendOffer}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Official Offer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#090f20] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

/* =========================================================================
   3. SEE HOW IT WORKS MODAL
   ========================================================================= */
interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

export function HowItWorksModal({ isOpen, onClose, onGetStarted }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              · Product Tour
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center max-w-md mx-auto">
            <h4 className="text-xl font-bold text-slate-900 mb-2">
              Transforming how card shops buy collections
            </h4>
            <p className="text-xs text-slate-600">
              Stop losing customer messages across Instagram, email, and sticky notes. TCGBuyer gives you a professional buying pipeline.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h5 className="font-bold text-xs text-slate-900">Custom Branded Portal</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your store gets a responsive link where collectors can upload cards anytime, day or night.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h5 className="font-bold text-xs text-slate-900">Live Appraisal Estimates</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatic baseline calculations based on current TCG market values and your target buy margins.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h5 className="font-bold text-xs text-slate-900">Single-Click Offers & Payout Tracking</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Send offers directly to the customer via SMS/email with clear accept/counter options.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onGetStarted();
              }}
              className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. CONTACT MODAL
   ========================================================================= */
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <span className="font-bold text-sm text-slate-900">Contact TCGBuyer Team</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-900">Message Received</h4>
              <p className="text-xs text-slate-500">
                Our dealer support team will get back to you within 2 business hours.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Card Vault"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us about your store or question..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
