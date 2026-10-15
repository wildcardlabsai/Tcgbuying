/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { IS_LOCAL } from '../config';
import { readJson, writeJson } from './localStore';
import { CurrencyCode, isCurrency, r2 } from './currency';

export interface InfoBlock {
  title: string;
  body: string;
}

/** Per-card bulk rates, in the shop's `currency`. */
export interface BulkRates {
  commons: number;
  holos: number;
  ultraRares: number;
  sealedPacks: number;
}

/** How much the shop pays: a percentage of estimated market value, plus flat bulk rates. */
export interface PricingSettings {
  cashPercent: number;
  creditPercent: number;
  /** The shop's own currency: default display currency and the currency bulk rates are entered in. */
  currency: CurrencyCode;
  bulk: BulkRates;
}

export const DEFAULT_PRICING: PricingSettings = {
  cashPercent: 72,
  creditPercent: 84,
  currency: 'GBP',
  bulk: { commons: 0.012, holos: 0.05, ultraRares: 0.5, sealedPacks: 3.2 },
};

const num = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function sanitizePricing(raw: any): PricingSettings {
  const d = DEFAULT_PRICING;
  return {
    cashPercent: num(raw?.cashPercent, 1, 100, d.cashPercent),
    creditPercent: num(raw?.creditPercent, 1, 150, d.creditPercent),
    currency: isCurrency(raw?.currency) ? raw.currency : d.currency,
    bulk: {
      commons: r2(num(raw?.bulk?.commons, 0, 1000, d.bulk.commons) * 1000) / 1000,
      holos: r2(num(raw?.bulk?.holos, 0, 1000, d.bulk.holos) * 1000) / 1000,
      ultraRares: r2(num(raw?.bulk?.ultraRares, 0, 10000, d.bulk.ultraRares) * 100) / 100,
      sealedPacks: r2(num(raw?.bulk?.sealedPacks, 0, 10000, d.bulk.sealedPacks) * 100) / 100,
    },
  };
}

/** What a dealer customises about the page their customers see. */
export interface Storefront {
  pricing: PricingSettings;
  tagline: string;
  welcome: string;
  accent: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  hours: string;
  infoBlocks: InfoBlock[];
}

export const ACCENT_PRESETS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0f172a'];
export const MAX_INFO_BLOCKS = 6;

export const EMPTY_STOREFRONT: Storefront = {
  pricing: DEFAULT_PRICING,
  tagline: '',
  welcome: '',
  accent: ACCENT_PRESETS[0],
  logoUrl: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  hours: '',
  infoBlocks: [],
};

const LIMITS = { tagline: 120, welcome: 1500, contactEmail: 120, contactPhone: 40, address: 300, hours: 200, title: 80, body: 1200 };
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');

/** Coerce anything read from storage into a safe, size-limited Storefront. */
export function sanitizeStorefront(raw: any): Storefront {
  const logo = clip(raw?.logoUrl, 400_000);
  return {
    pricing: sanitizePricing(raw?.pricing),
    tagline: clip(raw?.tagline, LIMITS.tagline),
    welcome: clip(raw?.welcome, LIMITS.welcome),
    accent: /^#[0-9a-fA-F]{6}$/.test(raw?.accent) ? raw.accent : EMPTY_STOREFRONT.accent,
    logoUrl: /^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/.test(logo) ? logo : '',
    contactEmail: clip(raw?.contactEmail, LIMITS.contactEmail),
    contactPhone: clip(raw?.contactPhone, LIMITS.contactPhone),
    address: clip(raw?.address, LIMITS.address),
    hours: clip(raw?.hours, LIMITS.hours),
    infoBlocks: (Array.isArray(raw?.infoBlocks) ? raw.infoBlocks : [])
      .slice(0, MAX_INFO_BLOCKS)
      .map((b: any) => ({ title: clip(b?.title, LIMITS.title), body: clip(b?.body, LIMITS.body) }))
      .filter((b: InfoBlock) => b.title.trim() || b.body.trim()),
  };
}

const KEY = 'tcg_storefronts';

/** Built-in content for the public sample shop (`/?shop=demo-shop`), used until a local demo dealer edits it. */
export const DEMO_DEALER_ID = 'demo-dealer';
const DEMO_STOREFRONT: Storefront = sanitizeStorefront({
  tagline: 'We buy Pokémon, Magic & Yu-Gi-Oh! collections',
  welcome:
    'Send us your cards for a fast, fair offer. Upload photos, see an estimate straight away, and we confirm the final price once we have seen them. Most offers are made within 24 hours.',
  accent: '#2563eb',
  contactEmail: 'buying@example.com',
  contactPhone: '0113 496 0123',
  address: 'Demo Card Shop\n12 Briggate\nLeeds LS1 6HD',
  hours: 'Mon–Sat 10am–5:30pm',
  infoBlocks: [
    { title: 'What we buy', body: 'Pokémon, Magic: The Gathering and Yu-Gi-Oh! singles, binders and bulk. Sealed product too.' },
    { title: 'How we pay', body: 'Bank transfer, PayPal or store credit (with a bonus). Payment within 2 working days of accepting.' },
    { title: 'Postage', body: 'Use a tracked, insured service. We return anything you decline, free of charge.' },
  ],
});

export async function getStorefront(dealerId: string): Promise<Storefront> {
  if (IS_LOCAL) {
    const saved = readJson<Record<string, unknown>>(KEY, {})[dealerId];
    return saved ? sanitizeStorefront(saved) : dealerId === DEMO_DEALER_ID ? DEMO_STOREFRONT : sanitizeStorefront(undefined);
  }
  if (dealerId === DEMO_DEALER_ID) return DEMO_STOREFRONT;
  try {
    const snap = await getDoc(doc(db, 'dealers', dealerId));
    return sanitizeStorefront(snap.data()?.storefront);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `dealers/${dealerId}`);
    return { ...EMPTY_STOREFRONT };
  }
}

export async function saveStorefront(dealerId: string, storefront: Storefront): Promise<boolean> {
  const clean = sanitizeStorefront(storefront);
  if (IS_LOCAL) {
    return writeJson(KEY, { ...readJson<Record<string, unknown>>(KEY, {}), [dealerId]: clean });
  }
  try {
    await updateDoc(doc(db, 'dealers', dealerId), { storefront: clean });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `dealers/${dealerId}`);
    return false;
  }
}

/** Public lookup used by the customer portal. */
export function storefrontFromDealerDoc(data: any): Storefront {
  return sanitizeStorefront(data?.storefront);
}

/** Resize an uploaded logo to a small PNG data URL (keeps transparency). */
export async function fileToLogoDataUrl(file: File, maxSide = 320): Promise<string> {
  const src = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
