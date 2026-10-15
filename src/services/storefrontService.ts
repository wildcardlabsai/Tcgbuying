/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { IS_LOCAL } from '../config';
import { readJson, writeJson } from './localStore';

export interface InfoBlock {
  title: string;
  body: string;
}

/** What a dealer customises about the page their customers see. */
export interface Storefront {
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

export async function getStorefront(dealerId: string): Promise<Storefront> {
  if (IS_LOCAL) return sanitizeStorefront(readJson<Record<string, unknown>>(KEY, {})[dealerId]);
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
