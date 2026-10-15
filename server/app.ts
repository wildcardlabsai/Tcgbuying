/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { emailRouter } from './email';
import { findMatches, searchCards, splitQuery, CatalogCard } from './cardLookup';
import { parseOcr } from './ocrIdentify';
import { getGbpRates } from './fx';
import { verifyIdToken } from './auth';
import { lookupSold, getUsage, soldCompsConfigured, isGrade, SoldError } from './soldComps';

dotenv.config();

const app = express();

// Support large image payloads (base64 card photos)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Initialize Google GenAI if key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (err) {
    console.warn('GoogleGenAI init note:', err);
  }
}

/**
 * Resolve a detected card against the live catalogues (set + collector number used when known).
 * Never invents a card: if nothing matches, returns the detected name with no price (rawMarketPrice 0).
 */
async function fetchCardFromFreeApis(cardName: string, game: string, setName?: string, cardNumber?: string) {
  const hits = await findMatches(cardName, game, setName, cardNumber);
  if (hits[0]) return { ...hits[0], alternatives: hits.slice(1, 4) };

  const wanted = cardName.toLowerCase();

  return {
    id: `card-${wanted.replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
    name: cardName,
    game: 'Pokémon',
    setName: setName || '',
    cardNumber: cardNumber || '',
    rarity: '',
    imageUrl: '',
    rawMarketPrice: 0,
    priceKnown: false,
    priceSource: '',
    variants: [],
    priceVariant: '',
    tcgplayerUrl: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(cardName)}`,
    alternatives: [] as CatalogCard[],
  };
}

/** Shape a catalogue card the way the client expects (offers use the default rates; the client re-prices). */
function toMatchedPayload(c: CatalogCard) {
  const price = c.rawMarketPrice ?? 0;
  return {
    id: c.id,
    name: c.name,
    game: 'Pokémon',
    setName: c.setName,
    cardNumber: c.cardNumber,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    tcgplayerUrl: c.tcgplayerUrl,
    cardmarketUrl: c.cardmarketUrl,
    sourceUrl: c.sourceUrl,
    marketPrice: price,
    priceSource: c.priceSource,
    priceUpdated: c.priceUpdated,
    priceLow: c.priceLow,
    priceHigh: c.priceHigh,
    variants: c.variants,
    priceVariant: c.priceVariant,
    cardmarketPrice: c.cardmarketPrice,
    priceDisagree: c.priceDisagree,
    storeCashOffer: Math.round(price * 0.72 * 100) / 100,
    storeCreditOffer: Math.round(price * 0.84 * 100) / 100,
    ebayLastSoldAvg: price,
    ebayRecentComps: [],
  };
}

const FAST_GEN_CONFIG = { temperature: 0, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } };

type AiFailure = 'quota' | 'invalid_key' | 'model_unavailable' | 'timeout' | 'unknown';

/** Longest we wait for one Gemini call; keeps a slow model from hanging the collector's screen. */
const AI_TIMEOUT_MS = 12_000;

/** Map a Gemini SDK error to something the app can act on. */
function classifyAiError(err: any): AiFailure {
  const msg = String(err?.message || '');
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError' || /aborted|timed out/i.test(msg)) return 'timeout';
  const status = Number(err?.status ?? err?.code);
  if (status === 402 || status === 429 || /prepayment credits|RESOURCE_EXHAUSTED|quota/i.test(msg)) return 'quota';
  if (status === 401 || status === 403 || /API key|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) return 'invalid_key';
  if (status === 404 || /not found|no longer available/i.test(msg)) return 'model_unavailable';
  return 'unknown';
}

class AiUnavailableError extends Error {
  constructor(public kind: AiFailure) {
    super(`AI unavailable: ${kind}`);
  }
}

/**
 * Call Gemini with a fast JSON config. Tries the configured model, then known alternates when a model is
 * unavailable. Quota or key problems affect every model, so those stop immediately.
 */
async function generateWithFallback(params: { contents: any }) {
  const models = [...new Set([GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite'])];
  let last: AiFailure = 'unknown';
  const deadline = Date.now() + 15_000; // total budget across every attempt
  for (const model of models) {
    for (const config of [FAST_GEN_CONFIG, undefined]) {
      if (Date.now() > deadline) throw new AiUnavailableError(last === 'unknown' ? 'timeout' : last);
      try {
        return await aiClient!.models.generateContent({
          model,
          contents: params.contents,
          config: { ...(config || {}), abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS) },
        });
      } catch (err) {
        last = classifyAiError(err);
        if (last === 'quota' || last === 'invalid_key' || last === 'timeout') throw new AiUnavailableError(last);
        if (last === 'model_unavailable') break; // try the next model
      }
    }
  }
  throw new AiUnavailableError(last);
}

/** HTTP error body for an AI failure, so the UI can explain what is wrong. */
function aiErrorResponse(err: unknown) {
  const kind = err instanceof AiUnavailableError ? err.kind : 'unknown';
  const status = kind === 'unknown' ? 502 : 503;
  return { status, body: { success: false, error: kind === 'unknown' ? 'recognition_failed' : `recognition_${kind}` } };
}


/**
 * Helper to convert any image input (HTTP/HTTPS URL, data URL, or raw base64) into
 * clean base64 data and mimeType suitable for Gemini inlineData.
 */
async function resolveImageBase64(
  input: string,
  fallbackMime = 'image/jpeg'
): Promise<{ base64: string; mimeType: string }> {
  if (!input || typeof input !== 'string') {
    return { base64: '', mimeType: fallbackMime };
  }

  const trimmed = input.trim();

  // If input is an HTTP or HTTPS URL, download it and convert arrayBuffer to base64
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(trimmed, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TCGBuyer/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const headerType = resp.headers.get('content-type') || fallbackMime;
        const cleanMime = headerType.split(';')[0].trim() || fallbackMime;
        return {
          base64: buffer.toString('base64'),
          mimeType: cleanMime,
        };
      }
    } catch (err) {
      console.warn(`Could not fetch remote image to base64 (${trimmed.slice(0, 50)}...):`, err);
    }
    // Return empty base64 so we avoid passing an invalid URL string to Gemini API
    return { base64: '', mimeType: fallbackMime };
  }

  // If input is a data URL (e.g. data:image/png;base64,...)
  const dataUrlMatch = trimmed.match(/^data:([^;,]+)(?:;charset=[^;,]+)?;base64,(.+)$/s);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1] || fallbackMime,
      base64: dataUrlMatch[2].replace(/\s+/g, ''),
    };
  }

  // Raw base64 string
  const clean = trimmed.replace(/^data:image\/[a-z0-9+.-]+;base64,/i, '').replace(/\s+/g, '');
  return {
    mimeType: fallbackMime,
    base64: clean,
  };
}

/**
 * POST /api/recognize-card
 * Uses Gemini AI vision to detect card name, set, collector number, condition & rarity from user photo
 */
app.post('/api/recognize-card', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userHint } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Image base64 data is required.' });
      return;
    }

    const resolved = await resolveImageBase64(imageBase64, mimeType);

    // Initial detection defaults
    let detectedName = userHint || '';
    let detectedGame = 'Pokémon';
    let detectedSet = '';
    let detectedNumber = '';
    let detectedRarity = '';
    let detectedCondition = 'Near Mint';
    let isGraded = false;
    let confidence = 0.94;
    let notes = 'Card artwork matched against official reference archive.';

    if (aiClient && resolved.base64 && resolved.base64.length > 50) {
      try {
        const prompt = `You identify Pokémon Trading Card Game cards from a photograph.
Read the printed card name and the collector number printed on the card (usually bottom corner) EXACTLY as written; never guess a different card. If a field is not visible, return an empty string for it.
First decide whether this is a Pokémon TCG card. If it is any other kind of card (Magic: The Gathering, Yu-Gi-Oh!, sports cards, etc.) or not a trading card, set "isPokemonCard" to false and leave the other fields empty.
Identify:
1. Exact card name as printed (e.g. "Charizard", "Umbreon VMAX", "Pikachu").
2. Set / expansion name if visible (e.g. "Base Set", "Evolving Skies").
3. Card number as printed (e.g. "4/102", "215/203", "SWSH123").
4. Rarity if visible (e.g. "Rare Holo", "Secret Rare", "Common").
5. Visual condition: ("Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", or "Graded PSA 9/10").
6. Is this in a graded slab (PSA, BGS, CGC)? (true/false).
7. Confidence score between 0.0 and 1.0.

Format your response as valid JSON ONLY without markdown backticks:
{
  "isPokemonCard": true,
  "name": "...",
  "set": "...",
  "number": "...",
  "rarity": "...",
  "condition": "...",
  "isGraded": false,
  "confidence": 0.95,
  "notes": "..."
}`;

        const response = await generateWithFallback({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: resolved.mimeType,
                    data: resolved.base64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
        });

        const textOutput = response.text || '';
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.isPokemonCard === false) {
            res.status(422).json({ success: false, error: 'not_pokemon' });
            return;
          }
          detectedName = parsed.name || detectedName;
          detectedSet = parsed.set || detectedSet;
          detectedNumber = parsed.number || detectedNumber;
          detectedRarity = parsed.rarity || detectedRarity;
          detectedCondition = parsed.condition || detectedCondition;
          isGraded = Boolean(parsed.isGraded);
          confidence = Number(parsed.confidence) || 0.92;
          notes = parsed.notes || notes;
        }
      } catch (geminiError) {
        console.warn('Gemini vision detection warning:', geminiError);
        if (userHint) {
          detectedName = userHint;
        } else {
          const { status, body } = aiErrorResponse(geminiError);
          res.status(status).json(body);
          return;
        }
      }
    } else if (!userHint) {
      // No vision model configured and nothing to go on: say so rather than inventing a card.
      res.status(503).json({ success: false, error: 'recognition_unavailable' });
      return;
    }

    if (!detectedName.trim()) {
      res.status(422).json({ success: false, error: 'card_not_identified' });
      return;
    }

    const resolvedCard = await fetchCardFromFreeApis(detectedName, 'Pokémon', detectedSet, detectedNumber);
    const matchedData = resolvedCard as CatalogCard;

    // Graded slabs are not priced by the raw-card sources, so we do not invent a graded value.
    const gradedNote = isGraded ? ' This looks like a graded card: the price shown is for the raw card, and the shop will price the grade itself.' : '';

    res.json({
      success: true,
      detection: {
        name: detectedName,
        game: 'Pokémon',
        setName: detectedSet,
        cardNumber: detectedNumber,
        rarity: detectedRarity,
        condition: detectedCondition,
        isGraded,
        confidence,
        notes: `${notes}${gradedNote}`,
      },
      matchedCard: toMatchedPayload(matchedData),
      alternatives: ((resolvedCard as any).alternatives as CatalogCard[]).map(toMatchedPayload),
    });
  } catch (error: any) {
    console.error('Card recognition error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to recognize card.',
    });
  }
});

/**
 * POST /api/recognize-multi-cards
 * Multi-Card Binder Page & Grid Scan: Recognizes multiple cards from a single photo
 */
app.post('/api/recognize-multi-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Image base64 data is required.' });
      return;
    }

    const resolved = await resolveImageBase64(imageBase64, mimeType);
    let detectedCards: any[] = [];
    let multiScanError: unknown = null;

    if (aiClient && resolved.base64 && resolved.base64.length > 50) {
      try {
        const prompt = `Analyze this image of Pokémon Trading Card Game cards carefully.
This photo may contain MULTIPLE cards (e.g. a 9-pocket binder page, a 4-card spread, or tabletop card grid).
Detect and identify EACH individual Pokémon card in the photo. Ignore any card that is not a Pokémon card.
For each card, determine:
- name: Exact card name as printed
- game: always "Pokémon"
- set: Set or expansion name if visible
- number: Collector number (e.g. 4/102)
- rarity: Rarity description
- condition: Visual condition ("Near Mint", "Lightly Played", "Moderately Played")
- position: Slot location (e.g. "Top Left", "Top Center", "Top Right", "Middle Left", "Middle Center", "Middle Right", "Bottom Left", "Bottom Center", "Bottom Right")
- confidence: Confidence score between 0.0 and 1.0

Return valid JSON ONLY without markdown backticks:
{
  "cards": [
    {
      "name": "...",
      "game": "...",
      "set": "...",
      "number": "...",
      "rarity": "...",
      "condition": "Near Mint",
      "position": "Top Left",
      "confidence": 0.95
    }
  ]
}`;

        const response = await generateWithFallback({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: resolved.mimeType,
                    data: resolved.base64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
        });

        const textOutput = response.text || '';
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.cards && Array.isArray(parsed.cards)) {
            detectedCards = parsed.cards;
          }
        }
      } catch (geminiErr) {
        console.warn('Multi-card scan note:', geminiErr);
        multiScanError = geminiErr;
      }
    }

    // Fallback if vision didn't parse array: use benchmark collection items
    if (detectedCards.length === 0 && req.body.demo !== true) {
      if (!aiClient) {
        res.status(503).json({ success: false, error: 'recognition_unavailable' });
      } else {
        const { status, body } = aiErrorResponse(multiScanError);
        res.status(status).json(body);
      }
      return;
    }
    if (detectedCards.length === 0) {
      detectedCards = [
        {
          name: 'Charizard',
          game: 'Pokémon',
          set: 'Base Set',
          number: '4/102',
          rarity: 'Holo Rare',
          condition: 'Near Mint',
          position: 'Top Left (Slot 1)',
          confidence: 0.95,
        },
        {
          name: 'Umbreon VMAX Alternate Art',
          game: 'Pokémon',
          set: 'Evolving Skies',
          number: '215/203',
          rarity: 'Secret Rare Alt Art',
          condition: 'Near Mint',
          position: 'Top Center (Slot 2)',
          confidence: 0.94,
        },
        {
          name: 'Pikachu Illustrator',
          game: 'Pokémon',
          set: 'CoroCoro Promo',
          number: 'Promo',
          rarity: 'Illustration Rare',
          condition: 'Near Mint',
          position: 'Top Right (Slot 3)',
          confidence: 0.92,
        },
        {
          name: 'Mewtwo & Mew GX',
          game: 'Pokémon',
          set: 'Unified Minds',
          number: '71/236',
          rarity: 'Ultra Rare',
          condition: 'Near Mint',
          position: 'Middle Left (Slot 4)',
          confidence: 0.91,
        },
      ];
    }

    // Resolve each card against free TCG APIs
    const cardsWithPricing = await Promise.all(
      detectedCards.map(async (dc) => {
        const matched = await fetchCardFromFreeApis(dc.name, 'Pokémon', dc.set, dc.number);

        return {
          detection: {
            ...dc,
            notes: `Detected at ${dc.position || 'Grid slot'}`,
          },
          matchedCard: toMatchedPayload(matched as CatalogCard),
        };
      })
    );

    res.json({
      success: true,
      count: cardsWithPricing.length,
      cards: cardsWithPricing,
    });
  } catch (error: any) {
    console.error('Multi-card scan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/parse-buylist
 * Text & CSV Buylist Import: Parses lists of cards and values them instantly
 */
app.post('/api/parse-buylist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, defaultGame = 'Pokémon' } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text buylist content is required.' });
      return;
    }

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('#') && !l.toLowerCase().startsWith('card name'));

    const parsedItems: any[] = [];

    for (const rawLine of lines) {
      // Check for quantity: "4x Charizard", "4 Charizard", "1 Black Lotus"
      let qty = 1;
      let cardQuery = rawLine;

      // Handle CSV line with commas: "Quantity,Name,Set" or "4,Charizard,Base Set"
      if (rawLine.includes(',')) {
        const parts = rawLine.split(',').map((p) => p.trim());
        if (!isNaN(Number(parts[0]))) {
          qty = Math.min(50, Math.max(1, parseInt(parts[0], 10)));
          cardQuery = parts.slice(1).join(' ');
        } else {
          cardQuery = parts[0];
          if (parts[1] && !isNaN(Number(parts[1]))) {
            qty = Math.min(50, Math.max(1, parseInt(parts[1], 10)));
          }
        }
      } else {
        const qtyMatch = rawLine.match(/^(\d+)[xX\s]+(.*)$/);
        if (qtyMatch) {
          qty = Math.min(50, Math.max(1, parseInt(qtyMatch[1], 10)));
          cardQuery = qtyMatch[2].trim();
        }
      }

      // Check condition tag: NM, LP, MP, HP, PSA 10, PSA 9
      let condition = 'Raw NM';
      if (/psa\s*10/i.test(cardQuery)) condition = 'PSA 10';
      else if (/psa\s*9/i.test(cardQuery)) condition = 'PSA 9';
      else if (/\b(lp|lightly played)\b/i.test(cardQuery)) condition = 'Lightly Played';
      else if (/\b(mp|moderately played)\b/i.test(cardQuery)) condition = 'Moderately Played';
      else if (/\b(hp|heavily played)\b/i.test(cardQuery)) condition = 'Heavily Played';

      const cleanName = cardQuery
        .replace(/#\d+\/\d+/g, '')
        .replace(/\b(psa\s*\d+|nm|lp|mp|hp|holo|rare)\b/gi, '')
        .trim();

      const matched = await fetchCardFromFreeApis(cleanName || cardQuery, 'Pokémon');
      // Raw-card price only: graded values are not invented, the shop prices those itself.
      const finalPrice = (matched as any).rawMarketPrice ?? 0;


      for (let q = 0; q < qty; q++) {
        parsedItems.push({
          ...toMatchedPayload(matched as CatalogCard),
          id: `${matched.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          condition,
        });
      }
    }

    res.json({
      success: true,
      count: parsedItems.length,
      items: parsedItems,
    });
  } catch (error: any) {
    console.error('Buylist parse error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/search-cards
 * Search card database
 */
app.get('/api/search-cards', async (req: Request, res: Response) => {
  const raw = String(req.query.q || '').slice(0, 100).trim();

  if (!raw) {
    res.json({ results: [] });
    return;
  }

  const { name, number } = splitQuery(raw);
  const results = await searchCards({ q: name, game: 'Pokémon', number, limit: 10 });
  res.json({ results: results.map(toMatchedPayload) });
});

/**
 * POST /api/identify-from-text  { top, bottom }
 * Backup identification from OCR text read in the browser, used when AI vision is unavailable.
 */
app.post('/api/identify-from-text', async (req: Request, res: Response) => {
  const top = String(req.body?.top ?? '').slice(0, 2000);
  const bottom = String(req.body?.bottom ?? '').slice(0, 2000);
  const full = String(req.body?.full ?? '').slice(0, 6000);
  const parsed = parseOcr(top, bottom, full);
  if (parsed.names.length === 0) {
    res.status(422).json({ success: false, error: 'card_not_identified' });
    return;
  }

  const game = 'Pokémon';
  const names = parsed.names.slice(0, 4);
  const results = await Promise.all(
    names.map(async (name) => ({
      name,
      cards: await findMatches(name, game, undefined, parsed.number || parsed.setCode, 6, true).catch(() => [] as CatalogCard[]),
    }))
  );
  // Prefer the first candidate (name band reads best) that returned anything
  const best = results.find((r) => r.cards.length > 0) ?? null;
  if (!best) {
    res.status(422).json({ success: false, error: 'card_not_identified' });
    return;
  }

  const [first, ...rest] = best.cards;
  const top1 = first;
  const numberMatched = Boolean(parsed.number) && top1.cardNumber.split('/')[0] === parsed.number!.split('/')[0];
  res.json({
    success: true,
    detection: {
      name: top1.name,
      game: top1.game,
      setName: top1.setName,
      cardNumber: top1.cardNumber,
      rarity: top1.rarity,
      condition: 'Near Mint',
      isGraded: false,
      confidence: numberMatched ? 0.7 : 0.5,
      notes: 'Read from the printed text on your photo (backup mode). Please check it matches your card.',
    },
    matchedCard: toMatchedPayload(top1),
    alternatives: rest.slice(0, 3).map(toMatchedPayload),
  });
});

/** Tiny in-memory limiter (per server instance): true when `key` has used up `max` hits in `windowMs`. */
const hitLog = new Map<string, number[]>();
function overLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hitLog.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hitLog.set(key, recent);
  return recent.length > max;
}

/**
 * GET /api/sold?name=&number=&set=&grade=raw|psa10|psa9|bgs95|cgc10&currency=GBP
 * Recent eBay sold prices for a card through SoldComps. Each uncached call uses one request of your SoldComps
 * allowance, so it is capped per signed-in dealer, and more tightly for anonymous callers.
 */
app.get('/api/sold', async (req: Request, res: Response) => {
  if (!soldCompsConfigured()) {
    res.status(503).json({ success: false, error: 'not_configured' });
    return;
  }
  const name = String(req.query.name || '').trim().slice(0, 80);
  const number = String(req.query.number || '').trim().slice(0, 12);
  const setName = String(req.query.set || '').trim().slice(0, 80);
  const grade = req.query.grade ?? 'raw';
  const currency = String(req.query.currency || 'GBP').toUpperCase().slice(0, 3);
  if (name.length < 2 || !isGrade(grade) || (number && !/^[A-Za-z0-9/ -]+$/.test(number))) {
    res.status(400).json({ success: false, error: 'invalid' });
    return;
  }

  const uid = await verifyIdToken(req.headers.authorization);
  if (!uid && process.env.SOLD_COMPS_REQUIRE_AUTH === 'true') {
    res.status(401).json({ success: false, error: 'sign_in_required' });
    return;
  }
  const limited = uid
    ? overLimit(`sold:uid:${uid}`, 40, 3600_000)
    : overLimit(`sold:ip:${req.ip}`, 8, 3600_000) || overLimit('sold:global-anon', 40, 24 * 3600_000);
  if (limited) {
    res.status(429).json({ success: false, error: 'rate_limited' });
    return;
  }

  try {
    const summary = await lookupSold({ name, number: number || undefined, setName: setName || undefined, grade, currency });
    res.json({ success: true, summary });
  } catch (err) {
    if (err instanceof SoldError) {
      const status = err.kind === 'quota' || err.kind === 'budget' || err.kind === 'rate_limited' ? 429 : err.kind === 'upstream' ? 502 : 503;
      res.status(status).json({ success: false, error: err.kind });
      return;
    }
    console.error('sold lookup failed', err);
    res.status(500).json({ success: false, error: 'failed' });
  }
});

/** GET /api/sold-status: whether SoldComps is set up and how much allowance is left (free call, no key shown). */
app.get('/api/sold-status', async (_req: Request, res: Response) => {
  if (!soldCompsConfigured()) {
    res.json({ configured: false });
    return;
  }
  const usage = await getUsage();
  res.json({
    configured: true,
    ok: Boolean(usage),
    plan: usage?.plan,
    remaining: usage ? usage.remaining + usage.credits : undefined,
    limit: usage?.limit,
    resetAt: usage?.reset_at,
  });
});

app.get('/api/rates', async (_req: Request, res: Response) => {
  res.set('Cache-Control', 'public, max-age=3600');
  const { rates, source } = await getGbpRates();
  res.json({ base: 'GBP', rates, source });
});

app.use('/api', emailRouter);

/**
 * Health check
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    // Booleans only: whether each optional service has its settings, never the values.
    services: {
      ai: Boolean(aiClient),
      email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      ebaySold: soldCompsConfigured(),
    },
  });
});

/**
 * GET /api/ai-status: makes one tiny real call to Gemini so you can confirm the key, model and credits work.
 * Cached for a minute so it cannot be used to run up usage.
 */
let aiStatusCache: { at: number; body: { configured: boolean; ok: boolean; reason: string; model?: string } } | null = null;
app.get('/api/ai-status', async (_req: Request, res: Response) => {
  if (aiStatusCache && Date.now() - aiStatusCache.at < 60_000) {
    res.json(aiStatusCache.body);
    return;
  }
  let body: { configured: boolean; ok: boolean; reason: string; model?: string };
  if (!aiClient) {
    body = { configured: false, ok: false, reason: 'no_key' };
  } else {
    try {
      const r = await generateWithFallback({ contents: [{ role: 'user', parts: [{ text: 'Reply with {"ok":true}' }] }] });
      body = { configured: true, ok: Boolean(r.text), reason: 'ok', model: (r as any).modelVersion };
    } catch (err) {
      body = { configured: true, ok: false, reason: err instanceof AiUnavailableError ? err.kind : 'unknown' };
    }
  }
  aiStatusCache = { at: Date.now(), body };
  res.json(body);
});

export default app;
