/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Logo from './Logo';
import { ArrowRight, Menu, X, ShieldCheck, UserCheck } from 'lucide-react';

interface NavbarProps {
  onGetStarted: () => void;
  onExploreFeatures?: () => void;
  onOpenDealerPortal?: () => void;
  onOpenCustomerPortal?: () => void;
  onOpenTracker?: () => void;
}

export default function Navbar({
  onGetStarted,
  onOpenDealerPortal,
  onOpenCustomerPortal,
  onOpenTracker,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          {/* Zone 1: Brand wordmark */}
          <a
            href="#"
            className="flex items-center gap-2 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
            aria-label="TCGBuyer Home"
          >
            <Logo size="md" />
          </a>

          {/* Zone 2: clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[14px] font-medium text-slate-600">
            <a
              href="#how-it-works"
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              How It Works
            </a>
            <button
              onClick={onOpenDealerPortal}
              className="hover:text-blue-600 font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              <span>Dealer Workspace</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>
            <button
              onClick={onOpenCustomerPortal}
              className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              Customer Buying Page
            </button>
            <button
              onClick={onOpenTracker}
              className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer text-slate-500 hover:text-slate-800"
            >
              Track Submission
            </button>
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Features
            </a>
            <a
              href="#faq"
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              FAQ
            </a>
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenDealerPortal}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Dealer Login
            </button>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:opacity-95 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile hamburger toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3 text-base font-medium text-slate-700">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDealerPortal && onOpenDealerPortal();
              }}
              className="text-left px-2 py-1 font-semibold text-blue-600 flex items-center justify-between"
            >
              <span>Dealer Workspace</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                Live DB
              </span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCustomerPortal && onOpenCustomerPortal();
              }}
              className="text-left px-2 py-1 text-slate-800 hover:text-blue-600"
            >
              Customer Buying Page
            </button>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1 hover:text-blue-600 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1 hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1 hover:text-blue-600 transition-colors"
            >
              FAQ
            </a>
          </nav>
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onGetStarted();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 rounded-lg shadow cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
