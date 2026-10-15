/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

const DEFAULT_DEALER_ID = 'the-card-vault';

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

const SEED_SUBMISSIONS: LiveSubmission[] = [
  {
    id: 'seed-1047',
    ref: '#TCG-1047',
    date: '14 Oct 2026',
    collection: 'Vintage & Modern Pokémon Collection',
    cards: 3,
    estValue: '£1,240',
    totalCashOffer: 1100,
    totalCreditOffer: 1280,
    status: 'Review',
    collector: 'Alex Henderson',
    email: 'alex.h@gmail.com',
    phone: '+44 7700 900142',
    notes: 'Binder collection with vintage Base Set Charizard and Evolving Skies secret rares.',
    preferredPayout: 'cash',
    photos: [
      'https://images.pokemontcg.io/base1/4_hires.png',
      'https://images.pokemontcg.io/swsh7/215_hires.png',
    ],
    items: [
      {
        id: 'c-1',
        name: 'Charizard',
        game: 'Pokémon',
        setName: 'Base Set',
        cardNumber: '4/102',
        rarity: 'Holo Rare',
        userPhoto: 'https://images.pokemontcg.io/base1/4_hires.png',
        officialImageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
        condition: 'Near Mint',
        marketPrice: 285,
        cashOffer: 205,
        creditOffer: 240,
        confirmed: true,
        dealerVerified: true,
        dealerNote: 'Authentic 1999 Base Set unlimited. Surface is clean.',
      },
      {
        id: 'c-2',
        name: 'Umbreon VMAX Alternate Art',
        game: 'Pokémon',
        setName: 'Evolving Skies',
        cardNumber: '215/203',
        rarity: 'Secret Rare Alt Art',
        userPhoto: 'https://images.pokemontcg.io/swsh7/215_hires.png',
        officialImageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
        condition: 'Near Mint',
        marketPrice: 680,
        cashOffer: 490,
        creditOffer: 575,
        confirmed: true,
        dealerVerified: true,
        dealerNote: 'Mint Moonbreon. Centering 55/45.',
      },
      {
        id: 'c-3',
        name: 'Mewtwo & Mew GX',
        game: 'Pokémon',
        setName: 'Unified Minds',
        cardNumber: '71/236',
        rarity: 'Ultra Rare',
        userPhoto: 'https://images.pokemontcg.io/sm11/71_hires.png',
        officialImageUrl: 'https://images.pokemontcg.io/sm11/71_hires.png',
        condition: 'Near Mint',
        marketPrice: 85,
        cashOffer: 62,
        creditOffer: 72,
        confirmed: true,
        dealerVerified: false,
      },
    ],
  },
  {
    id: 'seed-1046',
    ref: '#TCG-1046',
    date: '13 Oct 2026',
    collection: 'Magic: The Gathering Staples',
    cards: 2,
    estValue: '£8,645',
    totalCashOffer: 6200,
    totalCreditOffer: 7250,
    status: 'Offer Sent',
    collector: 'Sarah Jenkins',
    email: 'sarah.j@outlook.com',
    phone: '+44 7700 900381',
    notes: 'Unlimited Black Lotus in protective sleeve and Double Masters Mana Crypt.',
    preferredPayout: 'cash',
    offeredAmount: '£6,200',
    dealerOfferNotes: 'High-value vintage verified. Offer ready for immediate bank wire upon card receipt.',
    photos: [
      'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
      'https://cards.scryfall.io/large/front/4/d/4d960186-4559-4af0-bd22-63baa15f8939.jpg',
    ],
    items: [
      {
        id: 'mtg-1',
        name: 'Black Lotus',
        game: 'Magic: The Gathering',
        setName: 'Unlimited Edition',
        cardNumber: 'Artifact',
        rarity: 'Rare',
        userPhoto: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
        officialImageUrl: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
        condition: 'Lightly Played',
        marketPrice: 8500,
        cashOffer: 6120,
        creditOffer: 7140,
        confirmed: true,
        dealerVerified: true,
        dealerNote: 'Mild edge whitening on reverse top border. Genuine Unlimited printing.',
      },
      {
        id: 'mtg-2',
        name: 'Mana Crypt',
        game: 'Magic: The Gathering',
        setName: 'Double Masters',
        cardNumber: 'Artifact',
        rarity: 'Mythic Rare',
        userPhoto: 'https://cards.scryfall.io/large/front/4/d/4d960186-4559-4af0-bd22-63baa15f8939.jpg',
        officialImageUrl: 'https://cards.scryfall.io/large/front/4/d/4d960186-4559-4af0-bd22-63baa15f8939.jpg',
        condition: 'Near Mint',
        marketPrice: 145,
        cashOffer: 104,
        creditOffer: 122,
        confirmed: true,
        dealerVerified: true,
      },
    ],
  },
  {
    id: 'seed-1045',
    ref: '#TCG-1045',
    date: '12 Oct 2026',
    collection: 'Yu-Gi-Oh! 1st Edition Vintage',
    cards: 2,
    estValue: '£350',
    totalCashOffer: 250,
    totalCreditOffer: 295,
    status: 'New',
    collector: 'David Vance',
    email: 'david.vance@mail.com',
    phone: '+44 7700 900892',
    notes: 'Legend of Blue Eyes vintage ultra rares in top loaders.',
    preferredPayout: 'credit',
    photos: [
      'https://images.ygoprodeck.com/images/cards/89631139.jpg',
      'https://images.ygoprodeck.com/images/cards/46986414.jpg',
    ],
    items: [
      {
        id: 'ygo-1',
        name: 'Blue-Eyes White Dragon',
        game: 'Yu-Gi-Oh!',
        setName: 'Legend of Blue Eyes White Dragon',
        cardNumber: 'LOB-001',
        rarity: 'Ultra Rare',
        userPhoto: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
        officialImageUrl: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
        condition: 'Near Mint',
        marketPrice: 240,
        cashOffer: 172,
        creditOffer: 202,
        confirmed: true,
      },
      {
        id: 'ygo-2',
        name: 'Dark Magician',
        game: 'Yu-Gi-Oh!',
        setName: 'Legend of Blue Eyes White Dragon',
        cardNumber: 'LOB-005',
        rarity: 'Ultra Rare',
        userPhoto: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
        officialImageUrl: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
        condition: 'Near Mint',
        marketPrice: 110,
        cashOffer: 79,
        creditOffer: 92,
        confirmed: true,
      },
    ],
  },
];

/**
 * Listen to live submissions from Firestore
 */
export function subscribeToSubmissions(
  dealerId: string = DEFAULT_DEALER_ID,
  onUpdate: (submissions: LiveSubmission[]) => void
) {
  const colRef = collection(db, 'dealers', dealerId, 'submissions');

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed initial records into Firestore
        seedInitialSubmissions(dealerId);
        onUpdate(SEED_SUBMISSIONS);
        return;
      }

      const list: LiveSubmission[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          ref: data.reference || data.ref || `#TCG-${docSnap.id.slice(0, 4)}`,
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
        });
      });

      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `dealers/${dealerId}/submissions`);
      onUpdate(SEED_SUBMISSIONS);
    }
  );
}

/**
 * Seed initial submissions to Firestore
 */
async function seedInitialSubmissions(dealerId: string) {
  try {
    const colRef = collection(db, 'dealers', dealerId, 'submissions');
    for (const item of SEED_SUBMISSIONS) {
      await addDoc(colRef, {
        dealerId,
        reference: item.ref,
        date: item.date,
        collection: item.collection,
        cardCount: item.cards,
        estimatedValue: item.estValue.replace(/[^0-9]/g, ''),
        totalCashOffer: item.totalCashOffer,
        totalCreditOffer: item.totalCreditOffer,
        status: item.status,
        customerName: item.collector,
        customerEmail: item.email,
        customerPhone: item.phone,
        notes: item.notes,
        preferredPayout: item.preferredPayout,
        photos: item.photos || [],
        items: item.items || [],
        offeredAmount: item.offeredAmount || '',
        dealerOfferNotes: item.dealerOfferNotes || '',
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Initial seeding note:', err);
  }
}

/**
 * Create a new submission from customer portal with all card photos and matched metadata
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
  dealerId: string = DEFAULT_DEALER_ID
) {
  try {
    const refNumber = `#TCG-${Math.floor(1000 + Math.random() * 9000)}`;
    const colRef = collection(db, 'dealers', dealerId, 'submissions');
    const docRef = await addDoc(colRef, {
      dealerId,
      reference: refNumber,
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
      date: 'Just now',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      ref: refNumber,
      id: docRef.id,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `dealers/${dealerId}/submissions`);
    return {
      success: true,
      ref: `#TCG-${Math.floor(1000 + Math.random() * 9000)}`,
      id: 'local-' + Date.now(),
    };
  }
}

/**
 * Dealer update submission status, offer, and notes
 */
export async function updateSubmissionStatus(
  submissionId: string,
  newStatus: 'Review' | 'Offer Sent' | 'Accepted' | 'Completed' | 'Declined',
  offerValue?: string,
  dealerOfferNotes?: string,
  dealerId: string = DEFAULT_DEALER_ID
) {
  try {
    const docRef = doc(db, 'dealers', dealerId, 'submissions', submissionId);
    const updates: any = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };
    if (offerValue) {
      updates.offeredAmount = offerValue;
    }
    if (dealerOfferNotes) {
      updates.dealerOfferNotes = dealerOfferNotes;
    }
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `dealers/${dealerId}/submissions/${submissionId}`);
    return false;
  }
}

/**
 * Dealer update a specific card item within a submission (condition, verification, notes)
 */
export async function updateSubmissionCardItem(
  submissionId: string,
  updatedItems: SubmittedCardItem[],
  dealerId: string = DEFAULT_DEALER_ID
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
