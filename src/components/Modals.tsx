/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { sendContactMessage } from '../services/notifyService';

/* =========================================================================
   4. CONTACT MODAL
   ========================================================================= */
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', store: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    const result = await sendContactMessage(form);
    setSending(false);
    if (result === 'sent') {
      setSubmitted(true);
    } else {
      const fallback = import.meta.env.VITE_CONTACT_EMAIL;
      setSendError(
        fallback
          ? `We couldn't send your message from here. Please email us at ${fallback}.`
          : "We couldn't send your message right now. Please try again later."
      );
    }
  };

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
                Thanks for getting in touch. We'll reply to the email address you gave us.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={100}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={form.store}
                  onChange={(e) => setForm({ ...form, store: e.target.value })}
                  maxLength={100}
                  placeholder="e.g. The Card Vault"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@yourshop.co.uk"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={3}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  maxLength={4000}
                  placeholder="Tell us about your store or question..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              {sendError && <p className="text-xs text-red-600">{sendError}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
