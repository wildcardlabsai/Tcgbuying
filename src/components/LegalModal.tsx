/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';

export type LegalDoc = 'terms' | 'privacy';

const UPDATED = '15 October 2026';

const DOCS: Record<LegalDoc, { title: string; sections: { h: string; p: string[] }[] }> = {
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        h: '1. About TCGBuyer',
        p: [
          'TCGBuyer ("we", "us") provides software that lets trading card shops ("Dealers") run an online buying portal and lets collectors ("Collectors") submit cards for the Dealer to review and make an offer on.',
          'We provide the software only. Any sale of cards is a contract between the Collector and the Dealer, not with TCGBuyer.',
        ],
      },
      {
        h: '2. Dealer accounts',
        p: [
          'You must provide accurate information and keep your login details secure. You are responsible for all activity under your account and for the offers, payments and returns you make to Collectors.',
          'Dealers must comply with all laws that apply to buying second-hand goods, including identity, record-keeping and consumer rules.',
        ],
      },
      {
        h: '3. Estimates and card recognition',
        p: [
          'Card identification, condition grading and market values shown in TCGBuyer are automated estimates drawn from third-party sources and AI models. They may be wrong or out of date and are not a valuation, appraisal or guarantee of any price.',
          'The Dealer decides the final offer after inspecting the cards. Collectors are never obliged to accept an offer.',
        ],
      },
      {
        h: '4. Collectors',
        p: [
          'By submitting cards you confirm they are yours to sell and that the details you provide are accurate. A submission is a request for an offer, not a binding sale.',
        ],
      },
      {
        h: '5. Acceptable use',
        p: [
          'You must not misuse the service, attempt to access other users\' data, upload unlawful content, or submit counterfeit or stolen items.',
        ],
      },
      {
        h: '6. Availability and liability',
        p: [
          'We aim to keep TCGBuyer available but do not guarantee uninterrupted service. To the extent permitted by law, we are not liable for indirect or consequential loss, or for loss arising from reliance on estimates. Nothing in these terms limits liability that cannot lawfully be limited.',
        ],
      },
      {
        h: '7. Changes and contact',
        p: [
          'We may update these terms; continued use means you accept the updated version. Questions? Use the Contact link on the website.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        h: '1. What we collect',
        p: [
          'Dealers: shop name, email address and login credentials (handled by our authentication provider).',
          'Collectors: the name, email, phone number, payout preferences, notes and card photos you enter when you make a submission.',
        ],
      },
      {
        h: '2. How we use it',
        p: [
          'To run the service: showing submissions to the Dealer you chose, letting you track your submission, and sending offer notifications by email.',
          'Card photos are sent to an AI service to identify cards and estimate condition. We do not sell personal data or use it for advertising.',
        ],
      },
      {
        h: '3. Who sees your data',
        p: [
          'A Collector\'s submission is visible to the Dealer it was sent to and to anyone who knows the submission reference. Keep your reference private.',
          'We use service providers to host the app, store data, authenticate Dealers, process images with AI and send email. They process data only to provide those services.',
        ],
      },
      {
        h: '4. Retention and your rights',
        p: [
          'We keep data for as long as needed to provide the service or meet legal obligations. Under UK GDPR you may ask to access, correct or delete your personal data, or object to its processing. Contact us using the Contact link and, for a submission, tell us the Dealer and reference.',
          'Dealers are independent controllers of the Collector data they receive and are responsible for handling it lawfully.',
        ],
      },
      {
        h: '5. Cookies and storage',
        p: [
          'We use browser storage only for essential functions such as keeping you signed in. We do not use advertising cookies.',
        ],
      },
    ],
  },
};

interface LegalModalProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

export default function LegalModal({ doc, onClose }: LegalModalProps) {
  if (!doc) return null;
  const { title, sections } = DOCS[doc];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900">{title}</h2>
            <p className="text-[11px] text-slate-500">Last updated {UPDATED}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700">
          {sections.map((s) => (
            <section key={s.h}>
              <h3 className="font-bold text-slate-900 mb-1">{s.h}</h3>
              {s.p.map((t, i) => (
                <p key={i} className="mb-2 leading-relaxed">
                  {t}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
