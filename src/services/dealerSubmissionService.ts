/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface SubmittedCardItem {
  id: string;
  name: string;
  game: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  userPhoto: string;
  officialImageUrl?: string;
  condition: string;
  marketPrice: number;
  cashOffer: number;
  creditOffer: number;
  confirmed: boolean;
  dealerNote?: string;
  dealerVerified?: boolean;
}

export interface LiveSubmission {
  id?: string;
  ref: string;
  date: string;
  collection: string;
  cards: number;
  estValue: string;
  totalCashOffer?: number;
  totalCreditOffer?: number;
  status: 'Review' | 'Offer Sent' | 'New' | 'Completed' | 'Accepted' | 'Declined';
  collector: string;
  email: string;
  phone?: string;
  notes: string;
  preferredPayout?: 'cash' | 'credit';
  payoutMethodDetails?: string;
  items?: SubmittedCardItem[];
  photos?: string[];
  createdAt?: any;
  updatedAt?: any;
  dealerOfferNotes?: string;
  offeredAmount?: string;
}

function mapSubmission(id: string, data: Record<string, any>): LiveSubmission {
  return {
    id,
    ref: data.reference || data.ref || `#${id}`,
    date: data.date || 'Today',
    collection: data.collection || 'TCG Collection',
    cards: Number(data.cardCount || data.cards || (data.items ? data.items.length : 1)),
    estValue: data.estimatedValue ? `£${data.estimatedValue}` : data.estValue || '£0',
    totalCashOffer: data.totalCashOffer || Number(data.estimatedValue || 0),
    totalCreditOffer: data.totalCreditOffer || Math.round(Number(data.estimatedValue || 0) * 1.15),
    status: data.status || 'New',
    collector: data.customerName || data.collector || 'Valued Collector',
    email: data.customerEmail || data.email || '',
    phone: data.customerPhone || data.phone || '',
    notes: data.notes || '',
    preferredPayout: data.preferredPayout || 'cash',
    payoutMethodDetails: data.payoutMethodDetails || '',
    photos: data.photos || [],
    items: data.items || data.cardItems || [],
    offeredAmount: data.offeredAmount || data.offerValue || '',
    dealerOfferNotes: data.dealerOfferNotes || '',
    createdAt: data.createdAt,
  };
}

/**
 * Listen to a dealer's live submissions. Requires the signed-in dealer to own `dealerId`.
 */
export function subscribeToSubmissions(
  dealerId: string,
  onUpdate: (submissions: LiveSubmission[]) => void
) {
  const colRef = collection(db, 'dealers', dealerId, 'submissions');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => mapSubmission(d.id, d.data()));
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `dealers/${dealerId}/submissions`);
      onUpdate([]);
    }
  );
}

/**
 * Customer-side lookup of a single submission by its reference (e.g. "#TCG-A1B2C3D4").
 * The reference doubles as the (unguessable) document id.
 */
export async function getSubmissionByRef(dealerId: string, ref: string): Promise<LiveSubmission | null> {
  const id = ref.trim().replace(/^#/, '').toUpperCase();
  if (!/^[A-Z0-9-]{4,40}$/.test(id)) return null;
  try {
    const snap = await getDoc(doc(db, 'dealers', dealerId, 'submissions', id));
    return snap.exists() ? mapSubmission(snap.id, snap.data()) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `dealers/${dealerId}/submissions/${id}`);
    return null;
  }
}

function generateReferenceId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return 'TCG-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/**
 * Create a new submission from the customer portal for a given dealer.
 */
export async function createCustomerSubmission(
  submission: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    collection: string;
    cardCount: number;
    estimatedValue: number;
    totalCashOffer: number;
    totalCreditOffer: number;
    notes: string;
    preferredPayout: 'cash' | 'credit';
    payoutMethodDetails?: string;
    photos?: string[];
    items?: SubmittedCardItem[];
  },
  dealerId: string
): Promise<{ success: boolean; ref: string; id: string }> {
  const id = generateReferenceId();
  const ref = `#${id}`;
  try {
    await setDoc(doc(db, 'dealers', dealerId, 'submissions', id), {
      dealerId,
      reference: ref,
      customerName: submission.customerName,
      customerEmail: submission.customerEmail,
      customerPhone: submission.customerPhone,
      collection: submission.collection,
      cardCount: submission.cardCount,
      estimatedValue: submission.estimatedValue,
      totalCashOffer: submission.totalCashOffer,
      totalCreditOffer: submission.totalCreditOffer,
      status: 'New',
      notes: submission.notes || 'Submitted via online card recognition portal',
      preferredPayout: submission.preferredPayout,
      payoutMethodDetails: submission.payoutMethodDetails || '',
      photos: submission.photos || [],
      items: submission.items || [],
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, ref, id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `dealers/${dealerId}/submissions/${id}`);
    return { success: false, ref, id };
  }
}

/**
 * Update submission status, offer, and notes (dealer, or customer accepting/declining/countering).
 */
export async function updateSubmissionStatus(
  submissionId: string,
  newStatus: 'Review' | 'Offer Sent' | 'Accepted' | 'Completed' | 'Declined',
  offerValue: string | undefined,
  dealerOfferNotes: string | undefined,
  dealerId: string
) {
  try {
    const docRef = doc(db, 'dealers', dealerId, 'submissions', submissionId);
    const updates: Record<string, any> = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };
    if (offerValue) updates.offeredAmount = offerValue;
    if (dealerOfferNotes) updates.dealerOfferNotes = dealerOfferNotes;
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `dealers/${dealerId}/submissions/${submissionId}`);
    return false;
  }
}

/**
 * Dealer updates the card items within a submission (condition, verification, notes).
 */
export async function updateSubmissionCardItem(
  submissionId: string,
  updatedItems: SubmittedCardItem[],
  dealerId: string
) {
  try {
    const docRef = doc(db, 'dealers', dealerId, 'submissions', submissionId);
    await updateDoc(docRef, {
      items: updatedItems,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `dealers/${dealerId}/submissions/${submissionId}`);
    return false;
  }
}
