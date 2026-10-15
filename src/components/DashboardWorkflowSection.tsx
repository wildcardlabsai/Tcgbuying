/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Search,
  Mail,
  Clock,
  Tag,
  CheckCircle2,
  Package,
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  Inbox,
  Users,
  BadgePercent,
  Settings,
} from 'lucide-react';
import Logo from './Logo';

interface SubmissionRecord {
  ref: string;
  date: string;
  collection: string;
  cards: number;
  estValue: string;
  status: 'Review' | 'Offer Sent' | 'New' | 'Completed';
  collector: string;
  notes: string;
}

const initialSubmissions: SubmissionRecord[] = [
  {
    ref: '#TCG-1047',
    date: '12 Oct 2026',
    collection: 'Mixed TCG',
    cards: 142,
    estValue: '£1,240',
    status: 'Review',
    collector: 'Alex Henderson',
    notes: 'Binder collection with vintage 1st Edition base set & modern secrets.',
  },
  {
    ref: '#TCG-1046',
    date: '11 Oct 2026',
    collection: 'Pokémon',
    cards: 86,
    estValue: '£820',
    status: 'Offer Sent',
    collector: 'Sarah Jenkins',
    notes: 'Near-mint Sword & Shield alternate arts and graded PSA 9 Charizard.',
  },
  {
    ref: '#TCG-1045',
    date: '11 Oct 2026',
    collection: 'Magic: The Gathering',
    cards: 214,
    estValue: '£1,650',
    status: 'New',
    collector: 'David Vance',
    notes: 'Commander staples and modern fetch lands. Looking for quick bank payout.',
  },
  {
    ref: '#TCG-1044',
    date: '10 Oct 2026',
    collection: 'Yu-Gi-Oh!',
    cards: 57,
    estValue: '£320',
    status: 'Completed',
    collector: 'Marcus Ray',
    notes: 'Complete Retro Pack foil set. Payment sent via Faster Payments.',
  },
  {
    ref: '#TCG-1043',
    date: '09 Oct 2026',
    collection: 'Pokémon',
    cards: 301,
    estValue: '£2,480',
    status: 'Review',
    collector: 'Emma Watson',
    notes: 'Sun & Moon hyper rares and complete master sets.',
  },
];

interface DashboardWorkflowSectionProps {
  onSelectSubmission: (submission: SubmissionRecord) => void;
}

export default function DashboardWorkflowSection({
  onSelectSubmission,
}: DashboardWorkflowSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('dashboard');

  const filteredSubmissions = initialSubmissions.filter(
    (item) =>
      item.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.collection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.collector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="for-dealers" className="py-14 sm:py-20 lg:py-28 bg-[#f8fafc] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
          <div>
            <span className="text-[11px] sm:text-[12px] font-bold tracking-wider text-blue-600 uppercase mb-2 sm:mb-3 block">
              INSIDE TCGBUYER
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-2 sm:mb-3">
              One buying workflow. <br className="hidden sm:inline" />
              From submission to purchase.
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl">
              Give your team a clearer view of incoming collections, the offers you’re making and
              what needs attention next.
            </p>
          </div>

          <div className="shrink-0">
            <a
              href="#for-dealers"
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group"
            >
              <span>View all submissions</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Dashboard Mockup Container */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[580px]">
            {/* Sidebar: Horizontal scroll strip on mobile, vertical sidebar on lg+ */}
            <div className="lg:col-span-2 bg-[#090f20] p-2 sm:p-4 flex flex-col justify-between text-xs text-slate-400 border-b lg:border-b-0 lg:border-r border-slate-800">
              <div>
                <div className="hidden lg:block mb-6 px-1">
                  <Logo size="sm" variant="light" />
                </div>

                {/* Nav buttons */}
                <div className="flex lg:flex-col overflow-x-auto no-scrollbar gap-1 sm:gap-1.5 pb-1 lg:pb-0">
                  <button
                    onClick={() => setActiveNav('dashboard')}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors cursor-pointer text-left whitespace-nowrap text-xs ${
                      activeNav === 'dashboard'
                        ? 'bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/30'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setActiveNav('submissions')}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors cursor-pointer text-left whitespace-nowrap text-xs ${
                      activeNav === 'submissions'
                        ? 'bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/30'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Submissions</span>
                  </button>

                  <button
                    onClick={() => setActiveNav('offers')}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors cursor-pointer text-left whitespace-nowrap text-xs ${
                      activeNav === 'offers'
                        ? 'bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/30'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Offers</span>
                  </button>

                  <button
                    onClick={() => setActiveNav('purchases')}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors cursor-pointer text-left whitespace-nowrap text-xs ${
                      activeNav === 'purchases'
                        ? 'bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/30'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Purchases</span>
                  </button>

                  <button
                    onClick={() => setActiveNav('customers')}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors cursor-pointer text-left whitespace-nowrap text-xs ${
                      activeNav === 'customers'
                        ? 'bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/30'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Customers</span>
                  </button>

                  <button
                    onClick={() => setActiveNav('pricelists')}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors cursor-pointer text-left whitespace-nowrap text-xs ${
                      activeNav === 'pricelists'
                        ? 'bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/30'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <BadgePercent className="w-3.5 h-3.5" />
                    <span>Price Lists</span>
                  </button>

                  <button
                    onClick={() => setActiveNav('settings')}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors cursor-pointer text-left whitespace-nowrap text-xs ${
                      activeNav === 'settings'
                        ? 'bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/30'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>

              <div className="hidden lg:block pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Buying Portal</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
              </div>
            </div>

            {/* Main Area */}
            <div className="lg:col-span-10 p-4 sm:p-6 bg-white flex flex-col justify-between">
              <div>
                {/* Top header search & user profile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 sm:pb-5 sm:mb-5 border-b border-slate-100 gap-3">
                  <div className="relative w-full max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search submissions, customers..."
                      className="w-full bg-slate-50 text-slate-700 pl-8 pr-3 py-1.5 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none border border-slate-200 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      TS
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-slate-800 leading-none flex items-center gap-1">
                        <span>The Card Vault</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">Dealer Account</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4 sm:mb-5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Dashboard</h3>
                </div>

                {/* 4 KPI Stat Boxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
                  {/* Card 1 */}
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900">12</span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
                      New Submissions
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900">8</span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
                      Awaiting Review
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900">6</span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
                      Offers Sent
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900">14</span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
                      Completed Purchases
                    </div>
                  </div>
                </div>

                {/* Submissions Table & Activity Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                  
                  {/* Left: Recent Submissions */}
                  <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">Recent Submissions</h4>
                      <span className="text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                        View all →
                      </span>
                    </div>

                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100 text-[10px] sm:text-[11px]">
                            <th className="pb-2 font-medium">Reference</th>
                            <th className="pb-2 font-medium hidden sm:table-cell">Date</th>
                            <th className="pb-2 font-medium">Collection</th>
                            <th className="pb-2 font-medium hidden md:table-cell">Cards ⌵</th>
                            <th className="pb-2 font-medium">Est. Value</th>
                            <th className="pb-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredSubmissions.map((row) => (
                            <tr
                              key={row.ref}
                              onClick={() => onSelectSubmission(row)}
                              className="hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                              <td className="py-2.5 font-semibold text-slate-900 group-hover:text-blue-600 whitespace-nowrap">
                                {row.ref}
                              </td>
                              <td className="py-2.5 text-slate-500 text-[11px] hidden sm:table-cell whitespace-nowrap">
                                {row.date}
                              </td>
                              <td className="py-2.5 font-medium truncate max-w-[100px] sm:max-w-none">
                                {row.collection}
                              </td>
                              <td className="py-2.5 tabular-nums hidden md:table-cell">{row.cards}</td>
                              <td className="py-2.5 font-bold text-slate-900 tabular-nums whitespace-nowrap">
                                {row.estValue}
                              </td>
                              <td className="py-2.5 whitespace-nowrap">
                                {row.status === 'Review' && (
                                  <span className="inline-block px-2 py-0.5 text-[9.5px] sm:text-[10px] font-semibold text-amber-700 bg-amber-50 rounded border border-amber-200">
                                    Review
                                  </span>
                                )}
                                {row.status === 'Offer Sent' && (
                                  <span className="inline-block px-2 py-0.5 text-[9.5px] sm:text-[10px] font-semibold text-indigo-700 bg-indigo-50 rounded border border-indigo-200">
                                    ● Offer Sent
                                  </span>
                                )}
                                {row.status === 'New' && (
                                  <span className="inline-block px-2 py-0.5 text-[9.5px] sm:text-[10px] font-semibold text-purple-700 bg-purple-50 rounded border border-purple-200">
                                    New
                                  </span>
                                )}
                                {row.status === 'Completed' && (
                                  <span className="inline-block px-2 py-0.5 text-[9.5px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                                    ● Completed
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Recent Activity */}
                  <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Recent Activity</h4>
                        <span className="text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                          View all →
                        </span>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                              New submission received
                            </p>
                            <span className="text-[10px] sm:text-[11px] text-slate-500">
                              #TCG-1047 · 5 minutes ago
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                              Offer sent to customer
                            </p>
                            <span className="text-[10px] sm:text-[11px] text-slate-500">
                              #TCG-1046 · 28 minutes ago
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                              Customer accepted offer
                            </p>
                            <span className="text-[10px] sm:text-[11px] text-slate-500">
                              #TCG-1041 · 2 hours ago
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                              Purchase completed
                            </p>
                            <span className="text-[10px] sm:text-[11px] text-slate-500">
                              #TCG-1039 · 5 hours ago
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Daily Intake Activity</span>
                      <span className="text-blue-600 font-semibold">100% Up to Date</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
export type { SubmissionRecord };
