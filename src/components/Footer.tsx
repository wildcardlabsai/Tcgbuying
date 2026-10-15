/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Logo from './Logo';
import { OPERATOR_NAME, OPERATOR_URL } from '../legalMeta';

interface FooterProps {
  onOpenContact?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenCollectorLogin?: () => void;
  onOpenAbout?: () => void;
  onOpenTracker?: () => void;
}

export default function Footer({ onOpenContact, onOpenTerms, onOpenPrivacy, onOpenCollectorLogin, onOpenAbout, onOpenTracker }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Left: Logo & mission */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Logo size="sm" />
            <span className="hidden sm:inline text-slate-300">|</span>
            <p className="text-slate-500 text-xs">
              Online buying pages for Pokémon card shops.
            </p>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap items-center gap-6 font-medium text-slate-600 text-xs">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                About Us
              </button>
            )}
            <button
              onClick={onOpenContact}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Contact
            </button>
            {onOpenTracker && (
              <button onClick={onOpenTracker} className="hover:text-slate-900 transition-colors cursor-pointer">
                Track a submission
              </button>
            )}
            {onOpenCollectorLogin && (
              <button
                onClick={onOpenCollectorLogin}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                Selling cards? Sign in
              </button>
            )}
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
          <p>© {new Date().getFullYear()} TCGBuyer. All rights reserved.</p>
          <p>
            Built and founded by{' '}
            <a href={OPERATOR_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline">
              {OPERATOR_NAME}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
