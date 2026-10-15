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
  /** Price provenance, so people can see where a number comes from. */
  priceSource?: string;
  priceUpdated?: string;
  priceLow?: number;
  priceHigh?: number;
  variants?: { key: string; label: string; price: number }[];
  priceVariant?: string;
  cardmarketPrice?: number;
  priceDisagree?: boolean;
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


/**
 * Recalculate price when user adjusts condition or graded status
 */
/** Share of the Near Mint price a card is worth in each raw condition. Dealers can change these. */
export interface ConditionFactors {
  lp: number;
  mp: number;
  hp: number;
  damaged: number;
}
export const DEFAULT_CONDITION_FACTORS: ConditionFactors = { lp: 0.82, mp: 0.62, hp: 0.42, damaged: 0.25 };

export function conditionMultiplier(condition: string, factors: ConditionFactors = DEFAULT_CONDITION_FACTORS): number {
  switch (condition) {
    case 'Lightly Played':
    case 'LP':
      return factors.lp;
    case 'Moderately Played':
    case 'MP':
      return factors.mp;
    case 'Heavily Played':
    case 'HP':
      return factors.hp;
    case 'Damaged':
      return factors.damaged;
    default:
      // Near Mint, and graded slabs: the raw-card price sources do not price grades, so no multiplier is invented.
      return 1;
  }
}

/**
 * Recalculate price when the collector adjusts condition. `baseMarketPrice` is the Near Mint price.
 * Graded slabs keep the raw price: the shop prices the grade itself.
 */
export function recalculateCardValuation(
  baseMarketPrice: number,
  condition: string,
  _isGraded: boolean,
  factors: ConditionFactors = DEFAULT_CONDITION_FACTORS
) {
  const updatedMarketPrice = Math.round(baseMarketPrice * conditionMultiplier(condition, factors) * 100) / 100;
  return {
    marketPrice: updatedMarketPrice,
    storeCashOffer: Math.round(updatedMarketPrice * 0.72 * 100) / 100,
    storeCreditOffer: Math.round(updatedMarketPrice * 0.84 * 100) / 100,
  };
}

/** Reject if `promise` does not settle within `ms`, so the UI can never wait forever. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
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
    const img = await withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = dataUrl;
      }),
      15000,
      'Image decode'
    );
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
    case 'recognition_timeout':
    case 'timeout':
      return 'The photo reader is taking too long right now.';
    case 'not_pokemon':
      return "That doesn't look like a Pokémon card. We only buy Pokémon cards.";
    case 'ocr_failed':
      return 'We could not read the card name from that photo. Try a clearer photo of the front of the card, or add it by name.';
    case 'card_not_identified':
      return 'We could not read a card in that photo. Try a clearer, well-lit photo of the front, or add the card by name.';
    default:
      return 'We could not identify that card right now. Please try again, or add the card by name.';
  }
}

/** fetch that gives up after `ms` (AbortSignal.timeout is missing on some older phones). */
export async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
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
    // OCR needs more pixels than the recognition upload does. The first run downloads the reader, which can be slow on mobile.
    text = await withTimeout(readCardText(await shrinkImage(rawBase64Data, 2200, 0.9)), 60000, 'Photo reader');
  } catch (err) {
    console.warn('OCR engine failed:', err);
    throw new OcrError('engine', 'engine');
  }
  if (!`${text.top}${text.bottom}${text.full}`.replace(/\s/g, '').length) throw new OcrError('no_text', 'no_text');

  let res: Response;
  try {
    res = await fetchWithTimeout('/api/identify-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(text),
    }, 30000);
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
  userHint?: string,
  onStage?: (text: string) => void
): Promise<RecognizedCardItem> {
  onStage?.('Preparing your photo…');
  const base64Data = await shrinkImage(rawBase64Data);
  onStage?.('Identifying the card…');
  const tempId = `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let failureCode: string | undefined;

  try {
    const res = await fetchWithTimeout('/api/recognize-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: 'image/jpeg',
        userHint,
      }),
    }, 40000);

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
      failureCode = 'bad_reply';
    } else {
      failureCode = (await res.json().catch(() => null))?.error || `http_${res.status}`;
    }
  } catch (err) {
    console.warn('API card recognition fallback:', err);
    failureCode = (err as Error)?.name === 'AbortError' ? 'timeout' : 'no_response';
  }

  if (failureCode === 'not_pokemon') throw new Error(recognitionErrorMessage(failureCode));

  // AI unavailable (or could not read it): try the in-browser OCR backup, but not for the built-in samples.
  if (!userHint) {
    try {
      onStage?.('Using the backup reader (the first time it needs to load)…');
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

  throw new Error(recognitionErrorMessage(failureCode));
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
      ...r,
      game: 'Pokémon',
      setName: r.setName || '',
      cardNumber: r.cardNumber || '',
      rarity: r.rarity || '',
      imageUrl: r.imageUrl || '',
      marketPrice: price,
      storeCashOffer: Math.round(price * 0.72 * 100) / 100,
      storeCreditOffer: Math.round(price * 0.84 * 100) / 100,
      ebayLastSoldAvg: price,
      ebayRecentComps: [],
    } as MatchedCard;
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

  throw new Error('The sample binder page is not available right now. Please try again.');
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
            confidence: 0.9,
            notes: 'Matched by name from your list. Check it is the right printing.',
          },
          matchedCard: { ...item, game: 'Pokémon', ebayRecentComps: [] },
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

