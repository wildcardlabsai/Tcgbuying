/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Logo from './Logo';

interface FooterProps {
  onOpenContact?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export default function Footer({ onOpenContact, onOpenTerms, onOpenPrivacy }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Left: Logo & mission */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Logo size="sm" />
            <span className="hidden sm:inline text-slate-300">|</span>
            <p className="text-slate-500 text-xs">
              TCGBuyer is buying software designed for trading card game dealers.
            </p>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap items-center gap-6 font-medium text-slate-600 text-xs">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <a href="#for-dealers" className="hover:text-slate-900 transition-colors">
              For Dealers
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
            <button
              onClick={onOpenContact}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-5 text-slate-400 text-xs">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-slate-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={onOpenTerms}
              className="hover:text-slate-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} TCGBuyer Ltd. All rights reserved.</p>
          <p>Built for trading card shops, hobby stores, and gaming centers worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
