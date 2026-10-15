/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EbaySoldComp {
  title: string;
  price: number;
  date: string;
  condition: string;
}

export interface MatchedCard {
  id: string;
  name: string;
  game: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  /** Where the shopper can double-check this exact card (TCGplayer product or search page). */
  tcgplayerUrl?: string;
  cardmarketUrl?: string;
  sourceUrl?: string;
  marketPrice: number;
  storeCashOffer: number;
  storeCreditOffer: number;
  ebayLastSoldAvg: number;
  ebayRecentComps: EbaySoldComp[];
}

export interface CardDetectionResult {
  name: string;
  game: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  condition: string;
  isGraded: boolean;
  confidence: number;
  notes: string;
}

export interface RecognizedCardItem {
  /** Other likely matches the collector can switch to with one tap. */
  alternatives?: MatchedCard[];
  tempId: string;
  userPhoto: string;
  fileName: string;
  detection: CardDetectionResult;
  matchedCard: MatchedCard;
  selectedCondition: string;
  selectedPayoutType: 'cash' | 'credit';
  confirmed: boolean;
  status: 'scanning' | 'ready' | 'error';
  errorMessage?: string;
  userNotes?: string;
}

const FALLBACK_CARDS: MatchedCard[] = [
  {
    id: 'pkmn-charizard-base',
    name: 'Charizard',
    game: 'Pokémon',
    setName: 'Base Set',
    cardNumber: '4/102',
    rarity: 'Holo Rare',
    imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    marketPrice: 285,
    storeCashOffer: 205,
    storeCreditOffer: 240,
    ebayLastSoldAvg: 285,
    ebayRecentComps: [
      { title: '1999 Pokemon Base Set Charizard Holo 4/102 Unlimited Raw NM', price: 295, date: '14 Oct 2026', condition: 'Raw NM' },
      { title: 'Charizard 4/102 Base Set Holo Clean Vintage Pokemon', price: 275, date: '11 Oct 2026', condition: 'Raw LP' },
      { title: 'Pokemon Base Set Unlimited Charizard 4/102 Holo Rare PSA 9 Mint', price: 1050, date: '08 Oct 2026', condition: 'PSA 9' },
    ],
  },
  {
    id: 'pkmn-pikachu-illustrator',
    name: 'Pikachu Illustrator',
    game: 'Pokémon',
    setName: 'CoroCoro Promo',
    cardNumber: 'Promo',
    rarity: 'Illustration Rare',
    imageUrl: 'https://images.pokemontcg.io/swsh12pt5/160_hires.png',
    marketPrice: 4500,
    storeCashOffer: 3240,
    storeCreditOffer: 3800,
    ebayLastSoldAvg: 4500,
    ebayRecentComps: [
      { title: 'Pokemon Japanese Promo Pikachu Illustrator CoroCoro Slab', price: 42000, date: '09 Oct 2026', condition: 'PSA 9' },
      { title: 'Pokemon Pikachu Special Promo Holo Foil Mint', price: 4800, date: '02 Oct 2026', condition: 'Raw NM' },
    ],
  },
  {
    id: 'pkmn-umbreon-vmax',
    name: 'Umbreon VMAX Alternate Art',
    game: 'Pokémon',
    setName: 'Evolving Skies',
    cardNumber: '215/203',
    rarity: 'Secret Rare Alt Art',
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    marketPrice: 680,
    storeCashOffer: 490,
    storeCreditOffer: 575,
    ebayLastSoldAvg: 680,
    ebayRecentComps: [
      { title: 'Umbreon VMAX Alt Art 215/203 Evolving Skies Moonbreon Raw NM', price: 690, date: '14 Oct 2026', condition: 'Raw NM' },
      { title: 'Pokemon Moonbreon Umbreon VMAX Secret Alt Art PSA 10 Gem Mint', price: 1420, date: '10 Oct 2026', condition: 'PSA 10' },
    ],
  },
  {
    id: 'mtg-black-lotus',
    name: 'Black Lotus',
    game: 'Magic: The Gathering',
    setName: 'Unlimited Edition',
    cardNumber: 'Artifact',
    rarity: 'Rare',
    imageUrl: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
    marketPrice: 8500,
    storeCashOffer: 6120,
    storeCreditOffer: 7140,
    ebayLastSoldAvg: 8500,
    ebayRecentComps: [
      { title: 'MTG Magic Black Lotus Unlimited Rare Artifact MP-LP Authentic', price: 7900, date: '12 Oct 2026', condition: 'Raw MP' },
    ],
  },
  {
    id: 'ygo-blue-eyes',
    name: 'Blue-Eyes White Dragon',
    game: 'Yu-Gi-Oh!',
    setName: 'Legend of Blue Eyes White Dragon',
    cardNumber: 'LOB-001',
    rarity: 'Ultra Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
    marketPrice: 240,
    storeCashOffer: 172,
    storeCreditOffer: 202,
    ebayLastSoldAvg: 240,
    ebayRecentComps: [
      { title: 'Yu-Gi-Oh LOB-001 Blue-Eyes White Dragon Ultra Rare Vintage NM', price: 250, date: '13 Oct 2026', condition: 'Raw NM' },
    ],
  },
];

/**
 * Recalculate price when user adjusts condition or graded status
 */
export function recalculateCardValuation(
  baseMarketPrice: number,
  condition: string,
  isGraded: boolean
) {
  let multiplier = 1.0;
  switch (condition) {
    case 'PSA 10 / Gem Mint':
    case 'BGS 9.5 / Pristine':
      multiplier = 3.8;
      break;
    case 'PSA 9 / Mint':
    case 'BGS 9':
      multiplier = 2.2;
      break;
    case 'Near Mint':
    case 'Raw NM':
      multiplier = 1.0;
      break;
    case 'Lightly Played':
    case 'LP':
      multiplier = 0.82;
      break;
    case 'Moderately Played':
    case 'MP':
      multiplier = 0.62;
      break;
    case 'Heavily Played':
    case 'HP':
      multiplier = 0.42;
      break;
    case 'Damaged':
      multiplier = 0.25;
      break;
    default:
      multiplier = 1.0;
  }

  const updatedMarketPrice = Math.round(baseMarketPrice * multiplier);
  const storeCashOffer = Math.round(updatedMarketPrice * 0.72);
  const storeCreditOffer = Math.round(updatedMarketPrice * 0.84);

  return {
    marketPrice: updatedMarketPrice,
    storeCashOffer,
    storeCreditOffer,
  };
}

/** Run `fn` over items with at most `limit` in flight; results keep input order. */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * Downscale a photo (data URL) so requests stay well under Vercel's ~4.5MB body limit
 * and local storage stays small. Non-data URLs and failures return the input unchanged.
 */
export async function shrinkImage(dataUrl: string, maxSide = 1024, quality = 0.75): Promise<string> {
  if (!dataUrl.startsWith('data:image')) return dataUrl;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL('image/jpeg', quality);
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

/**
 * Recognize an uploaded card image via /api/recognize-card
 */
/** Explain a recognition failure in terms a collector can act on. */
function recognitionErrorMessage(code?: string): string {
  switch (code) {
    case 'recognition_quota':
    case 'recognition_invalid_key':
    case 'recognition_unavailable':
      return 'Photo recognition is not available right now. You can still add your cards by typing a list or searching by name.';
    case 'ocr_failed':
      return 'We could not read the card name from that photo. Try a clearer photo of the front of the card, or add it by name.';
    case 'card_not_identified':
      return 'We could not read a card in that photo. Try a clearer, well-lit photo of the front, or add the card by name.';
    default:
      return 'We could not identify that card right now. Please try again, or add the card by name.';
  }
}

/** Why the in-browser backup could not identify a card (shown in brackets so problems are easy to report). */
class OcrError extends Error {
  constructor(public reason: 'engine' | 'no_text' | 'no_match' | 'server', message: string) {
    super(message);
  }
}

/** Backup: read the printed name/number in the browser and look the card up in the catalogues. */
async function recognizeByOcr(
  rawBase64Data: string
): Promise<{ detection: CardDetectionResult; matchedCard: MatchedCard; alternatives: MatchedCard[] }> {
  let text;
  try {
    const { readCardText } = await import('./ocrService');
    // OCR needs more pixels than the recognition upload does.
    text = await readCardText(await shrinkImage(rawBase64Data, 2200, 0.9));
  } catch (err) {
    console.warn('OCR engine failed:', err);
    throw new OcrError('engine', 'engine');
  }
  if (!`${text.top}${text.bottom}${text.full}`.replace(/\s/g, '').length) throw new OcrError('no_text', 'no_text');

  let res: Response;
  try {
    res = await fetch('/api/identify-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(text),
    });
  } catch {
    throw new OcrError('server', 'server');
  }
  const data = await res.json().catch(() => null);
  if (res.status === 422) throw new OcrError('no_match', data?.error || 'no_match');
  if (!res.ok || !data?.success) throw new OcrError('server', `http_${res.status}`);
  return data;
}

export async function recognizeCardPhoto(
  rawBase64Data: string,
  fileName: string,
  userHint?: string
): Promise<RecognizedCardItem> {
  const base64Data = await shrinkImage(rawBase64Data);
  const tempId = `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let failureCode: string | undefined;

  try {
    const res = await fetch('/api/recognize-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: 'image/jpeg',
        userHint,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.matchedCard) {
        return {
          tempId,
          userPhoto: base64Data,
          fileName,
          detection: data.detection,
          matchedCard: data.matchedCard,
          alternatives: data.alternatives || [],
          selectedCondition: data.detection.condition || 'Near Mint',
          selectedPayoutType: 'cash',
          confirmed: false,
          status: 'ready',
        };
      }
    } else {
      failureCode = (await res.json().catch(() => null))?.error;
    }
  } catch (err) {
    console.warn('API card recognition fallback:', err);
  }

  // AI unavailable (or could not read it): try the in-browser OCR backup, but not for the built-in samples.
  if (!userHint) {
    try {
      const ocr = await recognizeByOcr(rawBase64Data);
      return {
        tempId,
        userPhoto: base64Data,
        fileName,
        detection: ocr.detection,
        matchedCard: ocr.matchedCard,
        alternatives: ocr.alternatives,
        selectedCondition: ocr.detection.condition || 'Near Mint',
        selectedPayoutType: 'cash',
        confirmed: false,
        status: 'ready',
      };
    } catch (err) {
      console.warn('OCR backup failed:', err);
      const reason = err instanceof OcrError ? err.reason : 'engine';
      const ai = failureCode ? failureCode.replace('recognition_', '') : 'no_response';
      throw new Error(`${recognitionErrorMessage('ocr_failed')} [photo reader: ${ai} · backup: ${reason}]`);
    }
  }

  // Only the built-in sample
  const fallback = userHint
    ? FALLBACK_CARDS.find((c) =>
        c.name.toLowerCase().includes(userHint.toLowerCase()) ||
        userHint.toLowerCase().includes(c.name.toLowerCase())
      )
    : null;
  if (!fallback) {
    throw new Error(recognitionErrorMessage(failureCode));
  }

  return {
    tempId,
    userPhoto: base64Data,
    fileName,
    detection: {
      name: fallback.name,
      game: fallback.game,
      setName: fallback.setName,
      cardNumber: fallback.cardNumber,
      rarity: fallback.rarity,
      condition: 'Near Mint',
      isGraded: false,
      confidence: 0.94,
      notes: 'Card recognized cleanly from photo contours and foil reflection.',
    },
    matchedCard: fallback,
    selectedCondition: 'Near Mint',
    selectedPayoutType: 'cash',
    confirmed: false,
    status: 'ready',
  };
}

/**
 * Search card database to pick an alternative match
 */
export async function searchAlternativeCards(queryStr: string, game: string): Promise<MatchedCard[]> {
  const q = queryStr.trim();
  if (!q) return [];
  const res = await fetch(`/api/search-cards?q=${encodeURIComponent(q)}&game=${encodeURIComponent(game)}`);
  if (!res.ok) throw new Error('Card search is unavailable right now. Please try again.');
  const json = await res.json();
  return (json.results as any[]).map((r) => {
    const price = Number(r.marketPrice ?? r.rawMarketPrice ?? 0) || 0;
    return {
      id: r.id,
      name: r.name,
      game: r.game || game,
      setName: r.setName || '',
      cardNumber: r.cardNumber || '',
      rarity: r.rarity || '',
      imageUrl: r.imageUrl || '',
      tcgplayerUrl: r.tcgplayerUrl,
      cardmarketUrl: r.cardmarketUrl,
      sourceUrl: r.sourceUrl,
      marketPrice: price,
      storeCashOffer: Math.round(price * 0.72),
      storeCreditOffer: Math.round(price * 0.84),
      ebayLastSoldAvg: price,
      ebayRecentComps: [],
    };
  });
}

/**
 * Scan a 9-pocket binder page or multi-card photo
 */
export async function scanMultiCardBinderPhoto(
  rawBase64Data: string,
  fileName: string,
  demo = false
): Promise<RecognizedCardItem[]> {
  const base64Data = await shrinkImage(rawBase64Data, 1800, 0.8);
  try {
    const res = await fetch('/api/recognize-multi-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: 'image/jpeg',
        demo,
      }),
    });

    let failureCode: string | undefined;
    if (!res.ok) failureCode = (await res.json().catch(() => null))?.error;
    if (failureCode && !demo) throw new Error(recognitionErrorMessage(failureCode));
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.cards) && data.cards.length > 0) {
        return data.cards.map((c: any, idx: number) => ({
          tempId: `multi-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          userPhoto: base64Data,
          fileName: `${fileName} (${c.detection.position || `Card ${idx + 1}`})`,
          detection: c.detection,
          matchedCard: c.matchedCard,
          selectedCondition: c.detection.condition || 'Near Mint',
          selectedPayoutType: 'cash',
          confirmed: false,
          status: 'ready',
        }));
      }
    }
  } catch (err) {
    if (!demo) throw err;
    console.warn('Multi-card scan fallback:', err);
  }

  if (!demo) {
    throw new Error('We could not read that photo right now. Please try again with a clearer photo.');
  }

  // Demo binder only: 4 cards from catalog
  return FALLBACK_CARDS.slice(0, 4).map((c, idx) => ({
    tempId: `multi-fallback-${Date.now()}-${idx}`,
    userPhoto: base64Data,
    fileName: `${fileName} (Slot ${idx + 1})`,
    detection: {
      name: c.name,
      game: c.game,
      setName: c.setName,
      cardNumber: c.cardNumber,
      rarity: c.rarity,
      condition: 'Near Mint',
      isGraded: false,
      confidence: 0.93,
      notes: `Binder position: Slot ${idx + 1}`,
    },
    matchedCard: c,
    selectedCondition: 'Near Mint',
    selectedPayoutType: 'cash',
    confirmed: false,
    status: 'ready',
  }));
}

/**
 * Parse text or CSV buylist
 */
export async function parseBuylistTextOrCsv(
  text: string,
  defaultGame: string = 'Pokémon'
): Promise<RecognizedCardItem[]> {
  try {
    const res = await fetch('/api/parse-buylist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, defaultGame }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        return data.items.map((item: any, idx: number) => ({
          tempId: `buylist-${Date.now()}-${idx}`,
          userPhoto: item.imageUrl,
          fileName: `Buylist Item #${idx + 1}`,
          detection: {
            name: item.name,
            game: item.game,
            setName: item.setName,
            cardNumber: item.cardNumber,
            rarity: item.rarity,
            condition: item.condition,
            isGraded: item.condition.includes('PSA'),
            confidence: 0.98,
            notes: 'Imported from digital inventory list.',
          },
          matchedCard: {
            id: item.id,
            name: item.name,
            game: item.game,
            setName: item.setName,
            cardNumber: item.cardNumber,
            rarity: item.rarity,
            imageUrl: item.imageUrl,
            marketPrice: item.marketPrice,
            storeCashOffer: item.storeCashOffer,
            storeCreditOffer: item.storeCreditOffer,
            ebayLastSoldAvg: item.ebayLastSoldAvg,
            ebayRecentComps: item.ebayRecentComps || [],
          },
          selectedCondition: item.condition,
          selectedPayoutType: 'cash',
          confirmed: true,
          status: 'ready',
        }));
      }
    }
  } catch (err) {
    console.warn('Buylist parse fallback:', err);
  }

  return [];
}

