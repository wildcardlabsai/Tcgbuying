/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Upload,
  Camera,
  Plus,
  Trash2,
  TrendingUp,
  Search,
  CheckCircle2,
  Shield,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { estimateCardPricing, MarketComp } from '../services/marketPricingService';
import { createCustomerSubmission } from '../services/dealerSubmissionService';
import Logo from './Logo';

interface CustomerBuyingPageProps {
  onBackToHome: () => void;
  onTrackSubmission?: (ref: string) => void;
  shopName?: string;
}

export default function CustomerBuyingPage({
  onBackToHome,
  onTrackSubmission,
  shopName = 'The Card Vault',
}: CustomerBuyingPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cardSearch, setCardSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState('Pokémon');
  const [selectedCondition, setSelectedCondition] = useState('Raw NM');
  const [cardList, setCardList] = useState<
    Array<{ id: string; name: string; comp: MarketComp; userEstimated?: number }>
  >([
    {
      id: '1',
      name: 'Charizard Base Set Unlimited',
      comp: estimateCardPricing('Charizard Base Set Unlimited', 'Pokémon', 'Raw NM'),
    },
    {
      id: '2',
      name: 'Pikachu Illustrator Foil',
      comp: estimateCardPricing('Pikachu Illustrator Foil', 'Pokémon', 'PSA 10'),
    },
  ]);

  // Customer contact details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Calculate live totals based on eBay comps
  const totalMarketValue = cardList.reduce((acc, c) => acc + c.comp.ebayLastSoldAvg, 0);
  const totalCashOffer = cardList.reduce((acc, c) => acc + c.comp.storeCashOffer, 0);
  const totalCreditOffer = cardList.reduce((acc, c) => acc + c.comp.storeCreditOffer, 0);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotos((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardSearch.trim()) return;
    const comp = estimateCardPricing(cardSearch, selectedGame, selectedCondition);
    setCardList([
      ...cardList,
      {
        id: Date.now().toString(),
        name: cardSearch,
        comp,
      },
    ]);
    setCardSearch('');
  };

  const handleRemoveCard = (id: string) => {
    setCardList(cardList.filter((c) => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await createCustomerSubmission({
      customerName: name || 'Valued Collector',
      customerEmail: email || 'collector@example.com',
      customerPhone: phone || '+44 7700 900000',
      collection: `${selectedGame} Collection (${cardList.length} cards)`,
      cardCount: cardList.length,
      estimatedValue: totalCashOffer,
      totalCashOffer,
      totalCreditOffer,
      preferredPayout: 'cash',
      notes,
      photos,
    });

    setSubmittedRef(res.ref);
    setIsSubmitting(false);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0b1329] text-white border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
              <Shield className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="font-extrabold text-sm tracking-wide text-white uppercase">
              {shopName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="hidden sm:inline text-slate-400">Official Buying Portal</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Accepting Submissions
          </span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Step Indicator */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
            
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 1 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                }`}
              >
                1
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1.5">Add Cards</span>
            </div>

            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 2 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1.5">Contact Details</span>
            </div>

            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 3 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                }`}
              >
                3
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1.5">Confirmed</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Add Cards, Photos & Real-time eBay comps */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Header intro */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">
                Sell Your Cards to {shopName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Upload photos of your binders, slabs or singles. Our automated market engine checks
                recent verified eBay sold comps to provide preliminary store purchase estimates.
              </p>
            </div>

            {/* Photo Upload Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">1. Upload Photos of Cards</h3>
                </div>
                <span className="text-xs text-slate-400">Front & back recommended</span>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-xl p-5 bg-blue-50/20 hover:bg-blue-50/40 transition-colors flex flex-col items-center justify-center cursor-pointer text-center group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Click to select photos or drag & drop
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Supports JPG, PNG, HEIC from smartphone or camera (Max 20MB)
                </span>
              </label>

              {/* Photos Gallery */}
              {photos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    Uploaded Photos ({photos.length})
                  </span>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {photos.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-24 rounded-lg overflow-hidden border border-slate-300 shrink-0 group"
                      >
                        <img src={src} alt="Uploaded card" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card Search & Real-time eBay Comps */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  2. Add Card Names & Check eBay Last Sold Comps
                </h3>
              </div>

              <form onSubmit={handleAddCard} className="space-y-3 mb-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-6 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      placeholder="e.g. Charizard Base Set, Black Lotus, Gengar VMAX..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={selectedGame}
                      onChange={(e) => setSelectedGame(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="Pokémon">Pokémon</option>
                      <option value="Magic: The Gathering">Magic (MTG)</option>
                      <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
                      <option value="Disney Lorcana">Disney Lorcana</option>
                      <option value="One Piece TCG">One Piece</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex gap-2">
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="Raw NM">Raw Near Mint</option>
                      <option value="Raw LP">Raw Light Play</option>
                      <option value="Raw MP">Raw Moderate</option>
                      <option value="PSA 10">PSA 10 Gem Mint</option>
                      <option value="PSA 9">PSA 9 Mint</option>
                    </select>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Cards List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-200 text-[11px]">
                      <th className="pb-2">Card Details</th>
                      <th className="pb-2">Condition</th>
                      <th className="pb-2">eBay Last Sold Avg</th>
                      <th className="pb-2">Cash Buy Estimate</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {cardList.map((card) => (
                      <tr key={card.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 font-semibold text-slate-900">
                          {card.name}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {card.comp.game} · {card.comp.recentSalesCount} recent sales verified
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {card.comp.condition}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-900">
                          £{card.comp.ebayLastSoldAvg}
                          <span className="block text-[9.5px] text-slate-400 font-normal">
                            Range: £{card.comp.lowPrice} - £{card.comp.highPrice}
                          </span>
                        </td>
                        <td className="py-2.5 font-extrabold text-blue-600">
                          £{card.comp.storeCashOffer}
                          <span className="block text-[9.5px] text-emerald-600 font-normal">
                            Or £{card.comp.storeCreditOffer} store credit
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleRemoveCard(card.id)}
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Valuation Summary Banner */}
            <div className="bg-[#0b1329] text-white p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400">Total Collection Valuation</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                  £{totalCashOffer} <span className="text-xs font-normal text-slate-400">Cash Estimate</span>
                </div>
                <div className="text-xs text-emerald-400 mt-1">
                  Or ~£{totalCreditOffer} in Store Trade-in Credit (Market value: £{totalMarketValue})
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Submit Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Customer Contact & Submission */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Customer Information</h2>
              <p className="text-xs text-slate-500">
                Where should {shopName} send your official appraisal report and payout details?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Phone (for SMS updates)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7700 900123"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Payout</label>
                <select className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none">
                  <option>Faster Payments / Direct Bank Transfer</option>
                  <option>In-Store Cash (Shop Drop-off)</option>
                  <option>Store Trade-In Credit (+15% Bonus)</option>
                  <option>PayPal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Additional Notes / Questions for Dealer
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Binder pages kept in smoke-free home; all foils double-sleeved..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                ← Back to Cards
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting to Database...</span>
                ) : (
                  <>
                    <span>Submit to {shopName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Submission Confirmed */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center max-w-lg mx-auto space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900">Submission Received!</h3>

            <p className="text-sm text-slate-600">
              Your collection has been securely submitted to{' '}
              <span className="font-semibold text-slate-900">{shopName}</span>.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm">
              <span className="text-xs text-slate-400 block font-sans mb-1">Your Tracking Reference:</span>
              <span className="font-bold text-blue-600 text-lg">{submittedRef || '#TCG-1048'}</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              We have dispatched a confirmation email and SMS with your secure tracking link.
              The shop appraisal team will review your cards against current eBay sold averages and
              send your formal offer shortly.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onTrackSubmission && onTrackSubmission(submittedRef || '#TCG-1048')}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Track Live Status & Offers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setPhotos([]);
                  setSubmittedRef(null);
                }}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Submit Another Batch
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
