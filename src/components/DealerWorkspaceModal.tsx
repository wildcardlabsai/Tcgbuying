/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  X,
  Search,
  Mail,
  Clock,
  Tag,
  CheckCircle2,
  Package,
  TrendingUp,
  DollarSign,
  User,
  Phone,
  Send,
  Eye,
  LogOut,
  ShieldCheck,
  Sparkles,
  Inbox,
  LayoutDashboard,
  Filter,
} from 'lucide-react';
import {
  subscribeToSubmissions,
  updateSubmissionStatus,
  LiveSubmission,
} from '../services/dealerSubmissionService';
import { estimateCardPricing, benchmarkCards } from '../services/marketPricingService';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import Logo from './Logo';

interface DealerWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomerPortal: () => void;
}

export default function DealerWorkspaceModal({
  isOpen,
  onClose,
  onOpenCustomerPortal,
}: DealerWorkspaceModalProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('dealer@thecardvault.co.uk');
  const [activeTab, setActiveTab] = useState<'submissions' | 'market_comps' | 'settings'>('submissions');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'review' | 'sent' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState<LiveSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<LiveSubmission | null>(null);
  const [customOfferInput, setCustomOfferInput] = useState('');
  const [offerSuccessMsg, setOfferSuccessMsg] = useState(false);

  // Market comp search tool inside dealer portal
  const [compCardName, setCompCardName] = useState('Charizard Base Set');
  const [compResult, setCompResult] = useState(estimateCardPricing('Charizard Base Set'));

  // Subscribe to live Firestore updates
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeToSubmissions('the-card-vault', (list) => {
      setSubmissions(list);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        setUserEmail(res.user.email || 'dealer@thecardvault.co.uk');
        setIsLoggedIn(true);
      }
    } catch (err) {
      // If popup blocked or declined, enable demo login
      setIsLoggedIn(true);
    }
  };

  const handleSendOffer = async () => {
    if (!selectedSubmission) return;
    const finalOffer = customOfferInput || selectedSubmission.estValue;
    await updateSubmissionStatus(selectedSubmission.id || '1047', 'Offer Sent', finalOffer);
    setOfferSuccessMsg(true);
    setTimeout(() => {
      setOfferSuccessMsg(false);
      setSelectedSubmission((prev) => (prev ? { ...prev, status: 'Offer Sent', estValue: finalOffer } : null));
    }, 1500);
  };

  const handleMarkCompleted = async () => {
    if (!selectedSubmission) return;
    await updateSubmissionStatus(selectedSubmission.id || '1047', 'Completed');
    setSelectedSubmission((prev) => (prev ? { ...prev, status: 'Completed' } : null));
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.collector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.collection.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'new') return sub.status === 'New';
    if (statusFilter === 'review') return sub.status === 'Review';
    if (statusFilter === 'sent') return sub.status === 'Offer Sent';
    if (statusFilter === 'completed') return sub.status === 'Completed';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] max-h-[850px] overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Top Header */}
        <div className="bg-[#0b1329] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="light" />
            <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
              Dealer Management Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-300 hidden md:inline">
                  Logged in as <strong className="text-white">{userEmail}</strong>
                </span>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Authentication Required</span>
            )}

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOGIN SCREEN IF NOT AUTHENTICATED */}
        {!isLoggedIn ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Dealer Portal Login</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access incoming collection queries, appraisals, and customer payouts.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-lg shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <span>Instant Demo Dealer Access</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Database: Connected (Firestore)</span>
                <span className="text-emerald-600 font-semibold">Live Mode</span>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED DEALER WORKSPACE */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar navigation */}
            <div className="w-full md:w-56 bg-slate-900 text-slate-300 p-3 sm:p-4 flex md:flex-col justify-between shrink-0 border-r border-slate-800">
              <div className="space-y-1 w-full flex md:flex-col overflow-x-auto no-scrollbar gap-1 md:gap-1.5">
                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors w-full cursor-pointer ${
                    activeTab === 'submissions'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span>Submissions ({submissions.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('market_comps')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors w-full cursor-pointer ${
                    activeTab === 'market_comps'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>eBay Sold Price Checker</span>
                </button>
              </div>

              <div className="hidden md:block pt-4 border-t border-slate-800 space-y-2 text-xs">
                <button
                  onClick={onOpenCustomerPortal}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <span>Open Public Portal</span>
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-4 sm:p-6">
              
              {/* TAB 1: SUBMISSIONS MANAGEMENT PIPELINE */}
              {activeTab === 'submissions' && (
                <div className="space-y-4">
                  {/* Pipeline Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Incoming Collection Queries</h3>
                      <p className="text-xs text-slate-500">
                        Real-time submissions synced with your online store portal.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs shadow-2xs overflow-x-auto no-scrollbar">
                      {(['all', 'new', 'review', 'sent', 'completed'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setStatusFilter(filter)}
                          className={`px-2.5 py-1 rounded-md font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                            statusFilter === filter
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Reference (#TCG-...), customer name, or game..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  {/* Submissions List */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                            <th className="py-2.5 px-3 font-semibold">Ref</th>
                            <th className="py-2.5 px-3 font-semibold">Customer</th>
                            <th className="py-2.5 px-3 font-semibold">Collection</th>
                            <th className="py-2.5 px-3 font-semibold">Cards</th>
                            <th className="py-2.5 px-3 font-semibold">Est. Offer</th>
                            <th className="py-2.5 px-3 font-semibold">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {filteredSubmissions.map((sub) => (
                            <tr
                              key={sub.ref}
                              className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setCustomOfferInput(sub.estValue.replace(/[^0-9]/g, ''));
                              }}
                            >
                              <td className="py-3 px-3 font-mono font-bold text-blue-600">
                                {sub.ref}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                {sub.collector}
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {sub.email}
                                </span>
                              </td>
                              <td className="py-3 px-3">{sub.collection}</td>
                              <td className="py-3 px-3 tabular-nums">{sub.cards}</td>
                              <td className="py-3 px-3 font-extrabold text-slate-900 tabular-nums">
                                {sub.estValue}
                              </td>
                              <td className="py-3 px-3">
                                {sub.status === 'Review' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Review
                                  </span>
                                )}
                                {sub.status === 'Offer Sent' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    ● Offer Sent
                                  </span>
                                )}
                                {sub.status === 'New' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    New
                                  </span>
                                )}
                                {sub.status === 'Completed' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ● Completed
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                                  Manage →
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EBAY MARKET COMPS CHECKER */}
              {activeTab === 'market_comps' && (
                <div className="space-y-5">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      eBay Last Sold Averages & Valuation Engine
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Check real 30-day verified sales averages and dealer buy margins.
                    </p>

                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={compCardName}
                        onChange={(e) => setCompCardName(e.target.value)}
                        placeholder="Search card name or set..."
                        className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setCompResult(estimateCardPricing(compCardName))}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Calculate Comps
                      </button>
                    </div>

                    {/* Result breakdown card */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">eBay 30-Day Sold Avg</span>
                        <span className="text-xl font-extrabold text-slate-900">£{compResult.ebayLastSoldAvg}</span>
                        <span className="text-[10px] text-slate-500 block">Based on {compResult.recentSalesCount} verified sales</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Market Range</span>
                        <span className="text-base font-bold text-slate-800">£{compResult.lowPrice} – £{compResult.highPrice}</span>
                        <span className="text-[10px] text-slate-500 block">Excluding damaged copies</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Store Cash Buy (65%)</span>
                        <span className="text-lg font-extrabold text-blue-600">£{compResult.storeCashOffer}</span>
                        <span className="text-[10px] text-blue-500 block">Standard cash payout</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Store Credit (77%)</span>
                        <span className="text-lg font-extrabold text-emerald-600">£{compResult.storeCreditOffer}</span>
                        <span className="text-[10px] text-emerald-500 block">Trade-in bonus applied</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* SUBMISSION INSPECTION MODAL OVERLAY */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
              <div className="bg-[#0b1329] text-white p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-mono font-bold text-base text-blue-400">
                    {selectedSubmission.ref}
                  </h4>
                  <p className="text-xs text-slate-300">
                    From {selectedSubmission.collector} ({selectedSubmission.email})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Cards</span>
                    <span className="font-bold text-slate-800">{selectedSubmission.cards} items</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Collection</span>
                    <span className="font-bold text-slate-800">{selectedSubmission.collection}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Status</span>
                    <span className="font-bold text-blue-600">{selectedSubmission.status}</span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Customer Note:</span>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                    "{selectedSubmission.notes}"
                  </div>
                </div>

                {selectedSubmission.photos && selectedSubmission.photos.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Uploaded Card Photos:</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedSubmission.photos.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="Submitted card"
                          className="w-16 h-20 object-cover rounded-md border border-slate-300 shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Make Official Offer Box */}
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                  <span className="font-bold text-slate-900 block">Adjust Store Purchase Offer (£):</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customOfferInput}
                      onChange={(e) => setCustomOfferInput(e.target.value)}
                      placeholder="e.g. 850"
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-sm text-slate-900 w-32"
                    />
                    <button
                      onClick={handleSendOffer}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Offer</span>
                    </button>
                    <button
                      onClick={handleMarkCompleted}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Paid</span>
                    </button>
                  </div>
                  {offerSuccessMsg && (
                    <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Offer updated in database!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
