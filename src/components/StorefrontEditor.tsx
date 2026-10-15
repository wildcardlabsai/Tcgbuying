/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink, Upload } from 'lucide-react';
import {
  Storefront,
  EMPTY_STOREFRONT,
  ACCENT_PRESETS,
  MAX_INFO_BLOCKS,
  getStorefront,
  saveStorefront,
  fileToLogoDataUrl,
} from '../services/storefrontService';

interface StorefrontEditorProps {
  dealerId: string;
  shopName: string;
  onSaved: (s: Storefront) => void;
  onPreview: () => void;
}

const field =
  'w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500';
const label = 'block text-xs font-semibold text-slate-300 mb-1';

export default function StorefrontEditor({ dealerId, shopName, onSaved, onPreview }: StorefrontEditorProps) {
  const [sf, setSf] = useState<Storefront>({ ...EMPTY_STOREFRONT });
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getStorefront(dealerId).then((s) => {
      if (live) {
        setSf(s);
        setLoaded(true);
      }
    });
    return () => {
      live = false;
    };
  }, [dealerId]);

  const update = (patch: Partial<Storefront>) => {
    setSf((prev) => ({ ...prev, ...patch }));
    setStatus('idle');
  };

  const updateBlock = (i: number, patch: Partial<Storefront['infoBlocks'][number]>) =>
    update({ infoBlocks: sf.infoBlocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });

  const handleLogo = async (file?: File) => {
    if (!file) return;
    setLogoError(null);
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file.');
      return;
    }
    try {
      update({ logoUrl: await fileToLogoDataUrl(file) });
    } catch {
      setLogoError('Could not read that image.');
    }
  };

  const handleSave = async () => {
    setStatus('saving');
    const ok = await saveStorefront(dealerId, sf);
    setStatus(ok ? 'saved' : 'error');
    if (ok) onSaved(sf);
  };

  if (!loaded) return <p className="text-xs text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-slate-800 pb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">My Buying Page</h2>
          <p className="text-xs text-slate-400 mt-1">
            Customise what collectors see when they open your portal. Changes appear after you save.
          </p>
        </div>
        <button
          type="button"
          onClick={onPreview}
          className="shrink-0 flex items-center gap-1.5 text-xs text-blue-300 hover:text-white px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Preview
        </button>
      </div>

      {/* Branding */}
      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Branding</h3>

        <div>
          <span className={label}>Logo</span>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden">
              {sf.logoUrl ? <img src={sf.logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" /> : <span className="text-[10px] text-slate-600">No logo</span>}
            </div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
            </label>
            {sf.logoUrl && (
              <button type="button" onClick={() => update({ logoUrl: '' })} className="text-xs text-slate-400 hover:text-white">
                Remove
              </button>
            )}
          </div>
          {logoError && <p className="text-[11px] text-red-400 mt-1">{logoError}</p>}
        </div>

        <div>
          <span className={label}>Accent colour</span>
          <div className="flex items-center gap-2">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update({ accent: c })}
                aria-label={`Use colour ${c}`}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full border-2 ${sf.accent === c ? 'border-white' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className={label} htmlFor="sf-tagline">Tagline</label>
          <input id="sf-tagline" className={field} maxLength={120} value={sf.tagline} onChange={(e) => update({ tagline: e.target.value })} placeholder="e.g. We buy Pokémon, Magic & Yu-Gi-Oh! collections" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Welcome message</h3>
        <div>
          <label className={label} htmlFor="sf-welcome">Shown at the top of your buying page</label>
          <textarea id="sf-welcome" rows={4} className={field} maxLength={1500} value={sf.welcome} onChange={(e) => update({ welcome: e.target.value })} placeholder="Tell collectors how it works, what you're looking for, how fast you pay..." />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Extra info sections</h3>
            <button
              type="button"
              disabled={sf.infoBlocks.length >= MAX_INFO_BLOCKS}
              onClick={() => update({ infoBlocks: [...sf.infoBlocks, { title: '', body: '' }] })}
              className="flex items-center gap-1 text-xs font-semibold text-blue-300 hover:text-white disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Add section
            </button>
          </div>
          {sf.infoBlocks.length === 0 && (
            <p className="text-[11px] text-slate-500">e.g. “What we buy”, “Payment methods”, “Shipping & returns”.</p>
          )}
          {sf.infoBlocks.map((b, i) => (
            <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="flex gap-2">
                <input className={field} maxLength={80} value={b.title} onChange={(e) => updateBlock(i, { title: e.target.value })} placeholder="Section title" aria-label={`Section ${i + 1} title`} />
                <button type="button" onClick={() => update({ infoBlocks: sf.infoBlocks.filter((_, idx) => idx !== i) })} className="p-2 text-slate-400 hover:text-red-400" aria-label="Remove section">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea rows={3} className={field} maxLength={1200} value={b.body} onChange={(e) => updateBlock(i, { body: e.target.value })} placeholder="Details" aria-label={`Section ${i + 1} text`} />
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Contact &amp; address</h3>
        <p className="text-[11px] text-slate-500 -mt-2">Shown on your page and printed on packing slips so collectors know where to send cards.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="sf-email">Email</label>
            <input id="sf-email" type="email" className={field} maxLength={120} value={sf.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })} placeholder="buying@yourshop.co.uk" />
          </div>
          <div>
            <label className={label} htmlFor="sf-phone">Phone</label>
            <input id="sf-phone" className={field} maxLength={40} value={sf.contactPhone} onChange={(e) => update({ contactPhone: e.target.value })} placeholder="01234 567890" />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="sf-address">Postal address for parcels</label>
          <textarea id="sf-address" rows={3} className={field} maxLength={300} value={sf.address} onChange={(e) => update({ address: e.target.value })} placeholder={`${shopName}\n1 High Street\nTown, AB1 2CD`} />
        </div>
        <div>
          <label className={label} htmlFor="sf-hours">Opening hours</label>
          <input id="sf-hours" className={field} maxLength={200} value={sf.hours} onChange={(e) => update({ hours: e.target.value })} placeholder="Mon–Sat 10am–5pm" />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-bold text-xs text-white"
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' && <span className="text-xs text-emerald-400">Saved. Your page is updated.</span>}
        {status === 'error' && <span className="text-xs text-red-400">Could not save. Please try again.</span>}
      </div>
    </div>
  );
}
