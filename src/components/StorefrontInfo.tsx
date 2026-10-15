/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Storefront } from '../services/storefrontService';

const hasContent = (s: Storefront) => Boolean(s.tagline || s.welcome || s.infoBlocks.length);

/** Dealer-written welcome text and info sections, shown at the top of the buying page. */
export function StorefrontBanner({ storefront, shopName }: { storefront?: Storefront | null; shopName: string }) {
  if (!storefront || !hasContent(storefront)) return null;
  return (
    <section
      className="mb-8 rounded-2xl border bg-slate-900/70 p-5 sm:p-6 space-y-4"
      style={{ borderColor: storefront.accent }}
      aria-label={`About ${shopName}`}
    >
      <div className="flex items-center gap-4">
        {storefront.logoUrl && (
          <img src={storefront.logoUrl} alt={`${shopName} logo`} className="w-14 h-14 object-contain rounded-lg bg-white/5 shrink-0" />
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-black text-white">{shopName}</h2>
          {storefront.tagline && (
            <p className="text-sm font-semibold" style={{ color: storefront.accent }}>
              {storefront.tagline}
            </p>
          )}
        </div>
      </div>

      {storefront.welcome && <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">{storefront.welcome}</p>}

      {storefront.infoBlocks.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {storefront.infoBlocks.map((b, i) => (
            <div key={i} className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5">
              {b.title && <h3 className="text-xs font-bold text-white mb-1">{b.title}</h3>}
              {b.body && <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{b.body}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Contact details at the bottom of the buying page. */
export function StorefrontContact({ storefront }: { storefront?: Storefront | null }) {
  if (!storefront || !(storefront.contactEmail || storefront.contactPhone || storefront.address || storefront.hours)) return null;
  return (
    <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-300">
      {storefront.contactEmail && (
        <a href={`mailto:${storefront.contactEmail}`} className="flex items-center gap-2 hover:text-white">
          <Mail className="w-3.5 h-3.5 text-slate-500" /> {storefront.contactEmail}
        </a>
      )}
      {storefront.contactPhone && (
        <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-500" /> {storefront.contactPhone}</span>
      )}
      {storefront.hours && (
        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-500" /> {storefront.hours}</span>
      )}
      {storefront.address && (
        <span className="flex items-start gap-2 whitespace-pre-line"><MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5" /> {storefront.address}</span>
      )}
    </div>
  );
}
