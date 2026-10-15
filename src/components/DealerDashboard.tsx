/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Inbox,
  Layers,
  TrendingUp,
  Settings,
  Palette,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  Send,
  Eye,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Package,
  AlertCircle,
  Tag,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Check,
  X,
  Printer,
  BarChart3,
  Bell,
  Download,
  Pencil,
} from 'lucide-react';
import Logo from './Logo';
import {
  subscribeToSubmissions,
  updateSubmissionStatus,
  updateSubmissionCardItem,
  LiveSubmission,
  SubmittedCardItem,
} from '../services/dealerSubmissionService';
import PriceGuide from './PriceGuide';
import SoldPanel from './SoldPanel';
import { gradeFromCondition } from '../services/soldService';
import { signOutUser } from '../services/authService';
import { sendOfferEmail } from '../services/notifyService';
import PrintableManifestModal from './PrintableManifestModal';
import StorefrontEditor from './StorefrontEditor';
import BuylistSettings from './BuylistSettings';
import CardLinks from './CardLinks';
import DealerReports from './DealerReports';
import { downloadCsv, submissionsToCsv } from '../utils/csv';
import { r2 } from '../services/currency';
import CurrencySelect from './CurrencySelect';
import { useMoney } from '../CurrencyContext';
import { Storefront } from '../services/storefrontService';
import { IS_LOCAL } from '../config';
import ConditionGuideModal from './ConditionGuideModal';

interface DealerDashboardProps {
  onBackToHome: () => void;
  onOpenCustomerPortal: () => void;
  shopName?: string;
  dealerId: string;
  dealerSlug: string;
  userEmail: string;
  storefront: Storefront | null;
  onStorefrontSaved: (s: Storefront) => void;
}

export default function DealerDashboard({
  onBackToHome,
  onOpenCustomerPortal,
  shopName = 'My Card Shop',
  dealerId,
  dealerSlug,
  userEmail,
  storefront,
  onStorefrontSaved,
}: DealerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'card_vault' | 'comps' | 'settings' | 'storefront' | 'reports'>('submissions');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'review' | 'sent' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState<LiveSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<LiveSubmission | null>(null);
  
  // Custom offer sending state
  const [customOfferInput, setCustomOfferInput] = useState('');
  const [dealerOfferNoteInput, setDealerOfferNoteInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isConditionGuideOpen, setIsConditionGuideOpen] = useState(false);

  // High-res photo inspection modal
  const [inspectedPhoto, setInspectedPhoto] = useState<{ url: string; title: string; meta?: string } | null>(null);

  const { fmt, symbol, offerText, currency, toGbp, fromGbp } = useMoney();

  // Quick edit of one card's offer inside a submission
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editCash, setEditCash] = useState('');
  const [editNote, setEditNote] = useState('');
  const [soldOpenIdx, setSoldOpenIdx] = useState<number | null>(null);
  const creditRatio = storefront ? storefront.pricing.creditPercent / storefront.pricing.cashPercent : 84 / 72;

  // New-submission alerts: toast, tab title badge and (if allowed) a browser notification
  const seenIds = useRef<Set<string> | null>(null);
  const [unseen, setUnseen] = useState(0);
  const [alertPerm, setAlertPerm] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const portalLink = `${window.location.origin}/?shop=${dealerSlug}`;
  const [linkCopied, setLinkCopied] = useState(false);

  // Subscribe to real-time Firestore submissions
  useEffect(() => {
    seenIds.current = null;
    const unsubscribe = subscribeToSubmissions(dealerId, (list) => {
      const known = seenIds.current;
      const fresh = known ? list.filter((s) => s.id && !known.has(s.id) && s.status === 'New') : [];
      seenIds.current = new Set(list.map((s) => s.id!).filter(Boolean));
      if (fresh.length > 0) {
        const first = fresh[0];
        setNotificationMsg(`New submission ${first.ref} from ${first.collector}${fresh.length > 1 ? ` (+${fresh.length - 1} more)` : ''}`);
        setTimeout(() => setNotificationMsg(null), 6000);
        if (document.hidden) setUnseen((n) => n + fresh.length);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          new Notification('New TCGBuyer submission', { body: `${first.ref} from ${first.collector}` });
        }
      }
      setSubmissions(list);
      // If a submission is selected, update it with fresh Firestore state
      setSelectedSubmission((prev) => {
        if (!prev) return list[0] || null;
        const fresh = list.find((s) => s.id === prev.id || s.ref === prev.ref);
        return fresh || prev;
      });
    });
    return () => unsubscribe();
  }, [dealerId]);

  // Tab title shows how many arrived while you were away
  useEffect(() => {
    const base = 'TCGBuyer';
    document.title = unseen > 0 ? `(${unseen}) New submission${unseen > 1 ? 's' : ''} · ${base}` : document.title.replace(/^\(\d+\) New submissions? · /, '');
    const clear = () => setUnseen(0);
    window.addEventListener('focus', clear);
    return () => window.removeEventListener('focus', clear);
  }, [unseen]);

  // Update offer input whenever selected submission changes
  useEffect(() => {
    if (selectedSubmission) {
      setCustomOfferInput(
        selectedSubmission.offeredAmount ||
        offerText(selectedSubmission)
      );
      setDealerOfferNoteInput(selectedSubmission.dealerOfferNotes || '');
    }
  }, [selectedSubmission?.ref]);

  // Status update in Firestore
  const handleUpdateStatus = async (
    newStatus: 'Review' | 'Offer Sent' | 'Accepted' | 'Completed' | 'Declined',
    offerVal?: string
  ) => {
    if (!selectedSubmission) return;
    setIsUpdatingStatus(true);

    const docId = selectedSubmission.id!;
    const finalOffer = offerVal || customOfferInput;

    const typed = Number(String(finalOffer || '').replace(/[^0-9.]/g, ''));
    const offerGbp = Number.isFinite(typed) && typed > 0 ? r2(toGbp(typed, currency)) : undefined;

    await updateSubmissionStatus(
      docId,
      newStatus,
      finalOffer,
      dealerOfferNoteInput,
      dealerId,
      offerGbp
    );

    let msg = `Submission ${selectedSubmission.ref} updated to "${newStatus}"!`;
    if (newStatus === 'Offer Sent' || newStatus === 'Completed') {
      const emailResult = await sendOfferEmail(docId, newStatus === 'Completed' ? 'paid' : 'offer');
      if (emailResult === 'sent') msg += ' The collector has been emailed.';
      else if (newStatus === 'Offer Sent') msg += ' (No email sent: share the reference with the collector so they can track the offer.)';
    }
    setIsUpdatingStatus(false);
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Toggle card verification
  const handleToggleCardVerification = async (cardIndex: number) => {
    if (!selectedSubmission || !selectedSubmission.items) return;
    const updatedItems = [...selectedSubmission.items];
    const item = updatedItems[cardIndex];
    updatedItems[cardIndex] = {
      ...item,
      dealerVerified: !item.dealerVerified,
    };

    const docId = selectedSubmission.id!;
    await updateSubmissionCardItem(docId, updatedItems, dealerId);
  };

  const startEdit = (idx: number, cashGbp: number, note?: string) => {
    setEditIdx(idx);
    setEditCash(String(r2(fromGbp(cashGbp, currency))));
    setEditNote(note || '');
  };

  /** Save a per-card price change, recompute the submission's totals and offer, and note it for the collector. */
  const saveEdit = async () => {
    if (!selectedSubmission?.items || editIdx === null) return;
    const entered = Number(editCash);
    if (!Number.isFinite(entered) || entered < 0) return;
    const items = [...selectedSubmission.items];
    const old = items[editIdx];
    const cash = r2(toGbp(entered, currency));
    items[editIdx] = { ...old, cashOffer: cash, creditOffer: r2(cash * creditRatio), dealerNote: editNote.trim() || undefined };
    const totalCashOffer = r2(items.reduce((a, c) => a + (c.cashOffer || 0), 0));
    const totalCreditOffer = r2(items.reduce((a, c) => a + (c.creditOffer || 0), 0));
    await updateSubmissionCardItem(selectedSubmission.id!, items, dealerId, { totalCashOffer, totalCreditOffer });
    setCustomOfferInput(fmt(totalCashOffer));
    if (editNote.trim()) {
      const line = `${old.name}: ${editNote.trim()}`;
      setDealerOfferNoteInput((prev) => (prev ? `${prev}\n${line}` : line));
    }
    setEditIdx(null);
    setNotificationMsg(`Updated ${old.name}. New total ${fmt(totalCashOffer)}.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const enableAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    setAlertPerm(await Notification.requestPermission());
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.collector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.collection.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'new') return sub.status === 'New';
    if (statusFilter === 'review') return sub.status === 'Review';
    if (statusFilter === 'sent') return sub.status === 'Offer Sent';
    if (statusFilter === 'completed') return sub.status === 'Completed' || sub.status === 'Accepted';
    return true;
  });

  // Extract all cards across all submissions for the Card Vault view
  const allSubmittedCards = submissions.flatMap((s) =>
    (s.items || []).map((card) => ({
      ...card,
      submissionRef: s.ref,
      submissionDate: s.date,
      collector: s.collector,
      submissionStatus: s.status,
    }))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-[#070d1e] border-b border-slate-800/90 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="light" />
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <span className="font-extrabold text-sm text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {shopName} <span className="text-slate-400 font-normal">| Admin Command Dashboard</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{IS_LOCAL ? "Local demo data" : "Live sync active"}</span>
          </div>

          {alertPerm === 'default' && (
            <button
              onClick={enableAlerts}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
              title="Get a desktop notification when a submission arrives while this tab is in the background"
            >
              <Bell className="w-3.5 h-3.5" /> Enable alerts
            </button>
          )}

          <CurrencySelect />

          <button
            onClick={onOpenCustomerPortal}
            className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-white px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Portal</span>
          </button>

          <button
            onClick={onBackToHome}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Website Home
          </button>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <span className="text-xs text-slate-300 hidden md:inline truncate max-w-[150px]">
              {userEmail}
            </span>
            <button
              onClick={() => signOutUser()}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Dashboard Body with Left Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-[#091124] border-r border-slate-800/80 p-4 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            
            {/* Quick KPI Stats Summary */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dealer Vault Status
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Total In:</div>
                  <div className="text-base font-black text-white">{submissions.length}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Pending Review:</div>
                  <div className="text-base font-black text-amber-400">
                    {submissions.filter((s) => s.status === 'New' || s.status === 'Review').length}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Tabs */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'submissions'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" />
                  <span>Submissions Queue</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/40 font-bold">
                  {submissions.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('card_vault')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'card_vault'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  <span>All Submitted Cards</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/40 font-bold">
                  {allSubmittedCards.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('comps')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'comps'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Price Guide</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'reports'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </button>

              <button
                onClick={() => setActiveTab('storefront')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'storefront'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>My Buying Page</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pricing &amp; Bulk</span>
              </button>
            </nav>
          </div>

          {/* Footer info in sidebar */}
          <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
            <p className="font-semibold text-slate-400">TCGBuyer</p>
            <p>{IS_LOCAL ? 'Data: stored in this browser (demo)' : 'Data: Firestore'}</p>
          </div>
        </aside>

        {/* Center / Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          
          {/* TAB 1: SUBMISSIONS QUEUE & INSPECTION */}
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                  {(['all', 'new', 'review', 'sent', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                        statusFilter === filter
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {filter === 'sent' ? 'Offer Sent' : filter}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reference, collector, card..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submissions Grid or Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Submissions List (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
                    <span>Submissions List ({filteredSubmissions.length})</span>
                    <span className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          downloadCsv(
                            `tcgbuyer-submissions-${new Date().toISOString().slice(0, 10)}.csv`,
                            submissionsToCsv(filteredSubmissions, { money: fmt })
                          )
                        }
                        className="flex items-center gap-1 text-[10px] font-semibold normal-case tracking-normal text-blue-300 hover:text-white"
                        title="Download the submissions shown here as a spreadsheet"
                      >
                        <Download className="w-3 h-3" /> CSV
                      </button>
                      <span className="text-[10px] text-slate-500">Live updating</span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
                    {filteredSubmissions.map((sub) => {
                      const isSelected = selectedSubmission?.ref === sub.ref;
                      return (
                        <div
                          key={sub.ref}
                          onClick={() => setSelectedSubmission(sub)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                              : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-extrabold text-blue-400">
                              {sub.ref}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.status === 'New'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : sub.status === 'Review'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : sub.status === 'Offer Sent'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>

                          <div className="font-bold text-sm text-white truncate">{sub.collection}</div>
                          <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
                            <span>{sub.collector}</span>
                            <span className="font-mono font-bold text-emerald-400">{sub.estValueGbp ? fmt(sub.estValueGbp) : sub.estValue}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800/60">
                            <span>{sub.cards} cards submitted</span>
                            <span>{sub.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Selected Submission Deep Dive & All Cards Inspection (7 cols) */}
                <div className="lg:col-span-7">
                  {selectedSubmission ? (
                    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 space-y-6">
                      
                      {/* Submission Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-white">{selectedSubmission.ref}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              {selectedSubmission.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Submitted on {selectedSubmission.date} by {selectedSubmission.collector}
                          </p>
                        </div>

                        {/* Status Change Buttons & Print Manifest */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setIsPrintModalOpen(true)}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                            title="Print Packing Slip & Intake Sheet"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-400" />
                            <span>Print Manifest</span>
                          </button>
                          <button
                            onClick={() => setIsConditionGuideOpen(true)}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Grading Standards</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus('Review')}
                            disabled={isUpdatingStatus}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                          >
                            Mark In Review
                          </button>
                          <button
                            onClick={() => handleUpdateStatus('Completed')}
                            disabled={isUpdatingStatus}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 transition-colors"
                          >
                            Mark Payout Done
                          </button>
                        </div>
                      </div>

                      {/* Collector Information Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block">Collector</span>
                            <span className="font-semibold text-white">{selectedSubmission.collector}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block">Email</span>
                            <span className="font-semibold text-white">{selectedSubmission.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block">Phone</span>
                            <span className="font-semibold text-white">{selectedSubmission.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Official Offer Action Box */}
                      <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/40 border border-blue-500/40 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          {selectedSubmission.parcel && (
                            <p className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                              <Package className="w-3.5 h-3.5" />
                              Parcel posted {new Date(selectedSubmission.parcel.postedAt).toLocaleDateString('en-GB')}
                              {selectedSubmission.parcel.trackingNumber && ` · ${selectedSubmission.parcel.carrier} ${selectedSubmission.parcel.trackingNumber}`.trimEnd()}
                            </p>
                          )}
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Dealer Offer to Collector
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Preferred: <strong>{selectedSubmission.preferredPayout?.toUpperCase() || 'CASH'}</strong>
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-[11px] text-slate-300 mb-1">
                              Offer Amount ({symbol}):
                            </label>
                            <input
                              type="text"
                              value={customOfferInput}
                              onChange={(e) => setCustomOfferInput(e.target.value)}
                              placeholder={`e.g. ${symbol}1,150`}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400"
                            />
                          </div>
                          <div className="flex-2">
                            <label className="block text-[11px] text-slate-300 mb-1 flex items-center justify-between gap-2">
                              <span>Offer Notes (Sent to Collector):</span>
                              {(storefront?.offerTemplates.length ?? 0) > 0 && (
                                <select
                                  aria-label="Insert a saved message"
                                  value=""
                                  onChange={(e) => {
                                    const t = storefront!.offerTemplates[Number(e.target.value)];
                                    if (t) setDealerOfferNoteInput((prev) => (prev ? `${prev}\n${t.body}` : t.body));
                                  }}
                                  className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200"
                                >
                                  <option value="">Insert saved message…</option>
                                  {storefront!.offerTemplates.map((t, i) => (
                                    <option key={i} value={i}>{t.title}</option>
                                  ))}
                                </select>
                              )}
                            </label>
                            <textarea
                              rows={2}
                              value={dealerOfferNoteInput}
                              onChange={(e) => setDealerOfferNoteInput(e.target.value)}
                              placeholder="e.g. Verified NM Base Set Charizard. Immediate bank payout."
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('Offer Sent')}
                          disabled={isUpdatingStatus}
                          className="w-full py-2.5 rounded-lg font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Transmit Official Offer to Collector</span>
                        </button>
                      </div>

                      {/* ALL CARDS IN THIS SUBMISSION (User Requirement: Admin needs to view all cards submitted) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            <span>Submitted Cards ({selectedSubmission.items?.length || 0})</span>
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Click photo to zoom and inspect
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                          {(selectedSubmission.items || []).map((card, cIdx) => (
                            <div
                              key={card.id || cIdx}
                              className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                
                                {/* Customer Photo Thumbnail with click to zoom */}
                                <div
                                  onClick={() =>
                                    setInspectedPhoto({
                                      url: card.userPhoto || card.officialImageUrl || '',
                                      title: card.name,
                                      meta: `${card.game} • ${card.setName} • Condition: ${card.condition}`,
                                    })
                                  }
                                  className="relative group cursor-pointer shrink-0"
                                >
                                  <img
                                    src={card.userPhoto || card.officialImageUrl}
                                    alt={card.name}
                                    className="w-14 h-20 object-cover rounded-lg border border-slate-700 group-hover:border-blue-500 shadow transition-colors"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white rounded-lg transition-opacity">
                                    <Eye className="w-4 h-4" />
                                  </div>
                                </div>

                                {/* Official Matched Image Side-by-Side */}
                                {card.officialImageUrl && (
                                  <div className="hidden sm:block shrink-0">
                                    <img
                                      src={card.officialImageUrl}
                                      alt="Official art"
                                      className="w-14 h-20 object-cover rounded-lg border border-blue-500/40 shadow"
                                    />
                                  </div>
                                )}

                                {/* Card Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-sm font-bold text-white truncate">
                                      {card.name}
                                    </h5>
                                    {card.dealerVerified && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                        <ShieldCheck className="w-3 h-3" />
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400">
                                    {card.game} • {card.setName} • #{card.cardNumber} • {card.rarity}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs mt-1">
                                    <span className="text-amber-300 font-medium">
                                      Condition: {card.condition}
                                    </span>
                                    <span className="text-slate-400">|</span>
                                    <span className="text-emerald-400 font-bold">
                                      Comp: {fmt(card.marketPrice)} (Buy: {fmt(card.cashOffer)})
                                    </span>
                                  </div>
                                  <CardLinks
                                    card={{
                                      name: card.name,
                                      tcgplayerUrl:
                                        card.tcgplayerUrl ||
                                        `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`,
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setSoldOpenIdx(soldOpenIdx === cIdx ? null : cIdx)}
                                    className="mt-1 text-[11px] font-semibold text-blue-300 hover:text-white"
                                  >
                                    {soldOpenIdx === cIdx ? 'Hide eBay sold prices' : 'eBay sold prices'}
                                  </button>
                                  {soldOpenIdx === cIdx && (
                                    <SoldPanel
                                      card={{ name: card.name, cardNumber: card.cardNumber, setName: card.setName }}
                                      defaultGrade={gradeFromCondition(card.condition)}
                                      shopCurrency={storefront?.pricing.currency ?? 'GBP'}
                                      useMedianLabel={`Offer ${storefront?.pricing.cashPercent ?? 72}% of this`}
                                      onUseMedian={(median) =>
                                        startEdit(cIdx, r2((median * (storefront?.pricing.cashPercent ?? 72)) / 100), card.dealerNote)
                                      }
                                    />
                                  )}
                                  {card.dealerNote && (
                                    <p className="text-[11px] text-slate-400 italic mt-1">
                                      Staff Note: "{card.dealerNote}"
                                    </p>
                                  )}
                                </div>

                                {/* Authenticate Toggle Button */}
                                <div className="shrink-0 flex flex-col gap-1.5 items-end">
                                  <button
                                    type="button"
                                    onClick={() => (editIdx === cIdx ? setEditIdx(null) : startEdit(cIdx, card.cashOffer, card.dealerNote))}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>{editIdx === cIdx ? 'Cancel' : 'Edit offer'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCardVerification(cIdx)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                      card.dealerVerified
                                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                    }`}
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>{card.dealerVerified ? 'Authenticated' : 'Authenticate'}</span>
                                  </button>
                                </div>

                              </div>

                              {editIdx === cIdx && (
                                <div className="mt-2 pt-3 border-t border-slate-800 grid sm:grid-cols-[140px_1fr_auto] gap-2 items-end">
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-1" htmlFor={`edit-cash-${cIdx}`}>Your cash offer ({symbol})</label>
                                    <input
                                      id={`edit-cash-${cIdx}`}
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={editCash}
                                      onChange={(e) => setEditCash(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-1" htmlFor={`edit-note-${cIdx}`}>Reason, shown to the collector (optional)</label>
                                    <input
                                      id={`edit-note-${cIdx}`}
                                      value={editNote}
                                      maxLength={140}
                                      onChange={(e) => setEditNote(e.target.value)}
                                      placeholder="e.g. Edge wear, so I can offer a little less"
                                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={saveEdit}
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                      <Inbox className="w-8 h-8 mb-2 text-slate-600" />
                      <p className="text-sm font-semibold">Select a submission from the list</p>
                      <p className="text-xs text-slate-500 mt-1">
                        View collector photos, verify card condition, and generate official offers.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CARD SUBMISSIONS VAULT (ALL CARDS ACROSS ALL SUBMISSIONS) */}
          {activeTab === 'card_vault' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-black text-white">Card Submissions Vault</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Global repository of every card uploaded by collectors across all submissions. High-resolution photo inspection and grading.
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allSubmittedCards.map((card, idx) => (
                  <div
                    key={`${card.submissionRef}-${idx}`}
                    className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono font-bold text-blue-400">
                          {card.submissionRef}
                        </span>
                        <span className="text-slate-500">{card.submissionDate}</span>
                      </div>

                      {/* Photo Container */}
                      <div
                        onClick={() =>
                          setInspectedPhoto({
                            url: card.userPhoto || card.officialImageUrl || '',
                            title: card.name,
                            meta: `${card.game} • ${card.setName} • Condition: ${card.condition}`,
                          })
                        }
                        className="relative h-44 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group cursor-pointer"
                      >
                        <img
                          src={card.userPhoto || card.officialImageUrl}
                          alt={card.name}
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-5 h-5" />
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-black/80 text-white">
                          Collector Photo
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white truncate">{card.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {card.setName} • #{card.cardNumber}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-amber-400 text-[11px] font-semibold">{card.condition}</span>
                        <span className="text-emerald-400 font-bold">{fmt(card.marketPrice)}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Collector: {card.collector}</span>
                      <span className="text-blue-400 font-semibold">{card.submissionStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRICE GUIDE (live Pokémon prices) */}
          {activeTab === 'comps' && <PriceGuide storefront={storefront} />}

          {/* TAB 4: STORE SETTINGS & BUYLIST MARGINS */}
          {activeTab === 'reports' && <DealerReports submissions={submissions} />}

          {activeTab === 'storefront' && (
            <StorefrontEditor
              dealerId={dealerId}
              shopName={shopName}
              onSaved={onStorefrontSaved}
              onPreview={onOpenCustomerPortal}
            />
          )}

          {activeTab === 'settings' && (
            <BuylistSettings dealerId={dealerId} portalLink={portalLink} onSaved={onStorefrontSaved} />
          )}

        </main>
      </div>

      {/* PHOTO INSPECTION MODAL */}
      {inspectedPhoto && (
        <div
          onClick={() => setInspectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-3 cursor-default"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-white">{inspectedPhoto.title}</h4>
                {inspectedPhoto.meta && (
                  <p className="text-xs text-slate-400">{inspectedPhoto.meta}</p>
                )}
              </div>
              <button
                onClick={() => setInspectedPhoto(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-hidden rounded-xl bg-black flex items-center justify-center border border-slate-800">
              <img
                src={inspectedPhoto.url}
                alt={inspectedPhoto.title}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>High-resolution inspection mode</span>
              <button
                onClick={() => setInspectedPhoto(null)}
                className="px-3 py-1 rounded bg-slate-800 text-slate-200 hover:text-white"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE MANIFEST MODAL */}
      <PrintableManifestModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        storefront={storefront}
        submission={selectedSubmission}
        shopName={shopName}
      />

      {/* CONDITION STANDARDS GUIDE */}
      <ConditionGuideModal
        isOpen={isConditionGuideOpen}
        onClose={() => setIsConditionGuideOpen(false)}
      />
    </div>
  );
}
