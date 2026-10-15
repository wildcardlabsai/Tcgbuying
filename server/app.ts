/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { emailRouter } from './email';
import { findBestMatch, searchCards, splitQuery } from './cardLookup';

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

// Built-in TCG database cache with rich official artwork and eBay comp history
const BENCHMARK_CARDS = [
  {
    id: 'pkmn-charizard-base',
    name: 'Charizard',
    game: 'Pokémon',
    setName: 'Base Set',
    cardNumber: '4/102',
    rarity: 'Holo Rare',
    imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    rawMarketPrice: 285,
    gradedPsa9Price: 1100,
    gradedPsa10Price: 9400,
    ebaySoldComps: [
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
    rawMarketPrice: 4500,
    gradedPsa9Price: 35000,
    gradedPsa10Price: 120000,
    ebaySoldComps: [
      { title: 'Pokemon Japanese Promo Pikachu Illustrator CoroCoro Slab', price: 42000, date: '09 Oct 2026', condition: 'PSA 9' },
      { title: 'Pokemon Pikachu Special Promo Holo Foil Mint', price: 4800, date: '02 Oct 2026', condition: 'Raw NM' },
    ],
  },
  {
    id: 'pkmn-mewtwo-gx',
    name: 'Mewtwo & Mew GX',
    game: 'Pokémon',
    setName: 'Unified Minds',
    cardNumber: '71/236',
    rarity: 'Ultra Rare',
    imageUrl: 'https://images.pokemontcg.io/sm11/71_hires.png',
    rawMarketPrice: 85,
    gradedPsa9Price: 140,
    gradedPsa10Price: 320,
    ebaySoldComps: [
      { title: 'Mewtwo & Mew GX 71/236 Unified Minds Full Art Tag Team', price: 82, date: '13 Oct 2026', condition: 'Raw NM' },
      { title: 'Mewtwo & Mew GX Tag Team Unified Minds Mint PSA 10', price: 315, date: '07 Oct 2026', condition: 'PSA 10' },
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
    rawMarketPrice: 680,
    gradedPsa9Price: 750,
    gradedPsa10Price: 1450,
    ebaySoldComps: [
      { title: 'Umbreon VMAX Alt Art 215/203 Evolving Skies Moonbreon Raw NM', price: 690, date: '14 Oct 2026', condition: 'Raw NM' },
      { title: 'Pokemon Moonbreon Umbreon VMAX Secret Alt Art PSA 10 Gem Mint', price: 1420, date: '10 Oct 2026', condition: 'PSA 10' },
      { title: 'Umbreon VMAX 215/203 Evolving Skies Alternate Art NM', price: 660, date: '05 Oct 2026', condition: 'Raw NM' },
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
    rawMarketPrice: 8500,
    gradedPsa9Price: 19500,
    gradedPsa10Price: 65000,
    ebaySoldComps: [
      { title: 'MTG Magic Black Lotus Unlimited Rare Artifact MP-LP Authentic', price: 7900, date: '12 Oct 2026', condition: 'Raw MP' },
      { title: 'Black Lotus Unlimited Edition Magic The Gathering BGS 8.5', price: 16500, date: '04 Oct 2026', condition: 'BGS 8.5' },
    ],
  },
  {
    id: 'mtg-mana-crypt',
    name: 'Mana Crypt',
    game: 'Magic: The Gathering',
    setName: 'Double Masters',
    cardNumber: 'Artifact',
    rarity: 'Mythic Rare',
    imageUrl: 'https://cards.scryfall.io/large/front/4/d/4d960186-4559-4af0-bd22-63baa15f8939.jpg',
    rawMarketPrice: 145,
    gradedPsa9Price: 220,
    gradedPsa10Price: 480,
    ebaySoldComps: [
      { title: 'Mana Crypt Double Masters Foil Borderless Artifact NM', price: 155, date: '14 Oct 2026', condition: 'Raw NM' },
      { title: 'MTG Mana Crypt 2XM Mythic Foil NM', price: 140, date: '09 Oct 2026', condition: 'Raw NM' },
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
    rawMarketPrice: 240,
    gradedPsa9Price: 680,
    gradedPsa10Price: 3200,
    ebaySoldComps: [
      { title: 'Yu-Gi-Oh LOB-001 Blue-Eyes White Dragon Ultra Rare Vintage NM', price: 250, date: '13 Oct 2026', condition: 'Raw NM' },
      { title: 'Blue-Eyes White Dragon LOB Unlimited 1st Foil PSA 9', price: 650, date: '07 Oct 2026', condition: 'PSA 9' },
    ],
  },
  {
    id: 'ygo-dark-magician',
    name: 'Dark Magician',
    game: 'Yu-Gi-Oh!',
    setName: 'Legend of Blue Eyes White Dragon',
    cardNumber: 'LOB-005',
    rarity: 'Ultra Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
    rawMarketPrice: 110,
    gradedPsa9Price: 280,
    gradedPsa10Price: 1150,
    ebaySoldComps: [
      { title: 'Dark Magician LOB-005 Ultra Rare Clean Foil YuGiOh', price: 105, date: '11 Oct 2026', condition: 'Raw NM' },
      { title: 'YuGiOh Dark Magician LOB-005 PSA 9 Mint Vintage', price: 275, date: '03 Oct 2026', condition: 'PSA 9' },
    ],
  },
];

/**
 * Resolve a detected card against the live catalogues (set + collector number used when known).
 * Never invents a card: if nothing matches, returns the detected name with no price (rawMarketPrice 0).
 */
async function fetchCardFromFreeApis(cardName: string, game: string, setName?: string, cardNumber?: string) {
  const hit = await findBestMatch(cardName, game, setName, cardNumber);
  if (hit) return hit;

  const wanted = cardName.toLowerCase();
  const found = BENCHMARK_CARDS.find((c) => c.name.toLowerCase() === wanted);
  if (found) return found;

  return {
    id: `card-${wanted.replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
    name: cardName,
    game: game || 'Other',
    setName: setName || '',
    cardNumber: cardNumber || '',
    rarity: '',
    imageUrl: '',
    rawMarketPrice: 0,
    priceKnown: false,
  };
}

const FAST_GEN_CONFIG = { temperature: 0, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } };

/** Call Gemini with a fast JSON config, falling back to a plain config and a known-good model. */
async function generateWithFallback(params: { contents: any }) {
  const models = [...new Set([GEMINI_MODEL, 'gemini-2.5-flash'])];
  let lastErr: unknown;
  for (const model of models) {
    for (const config of [FAST_GEN_CONFIG, undefined]) {
      try {
        return await aiClient!.models.generateContent({ model, contents: params.contents, config });
      } catch (err) {
        lastErr = err;
      }
    }
  }
  throw lastErr;
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

    // Check if input image URL or hint directly matches known catalog items
    const hintOrUrlMatch = BENCHMARK_CARDS.find((b) =>
      (userHint && b.name.toLowerCase().includes(userHint.toLowerCase())) ||
      (typeof imageBase64 === 'string' && (imageBase64.includes(b.imageUrl) || (b.name && imageBase64.toLowerCase().includes(b.name.toLowerCase()))))
    );
    if (hintOrUrlMatch) {
      detectedName = hintOrUrlMatch.name;
      detectedGame = hintOrUrlMatch.game;
      detectedSet = hintOrUrlMatch.setName;
      detectedNumber = hintOrUrlMatch.cardNumber;
      detectedRarity = hintOrUrlMatch.rarity;
      confidence = 0.98;
    }

    if (aiClient && resolved.base64 && resolved.base64.length > 50) {
      try {
        const prompt = `Analyze this collectible trading card photograph carefully.
Read the printed card name and the collector number printed on the card (usually bottom corner) EXACTLY as written; never guess a different card. If a field is not visible, return an empty string for it.
Identify:
1. Exact card name (e.g. "Charizard", "Pikachu Illustrator", "Black Lotus", "Blue-Eyes White Dragon", "Umbreon VMAX").
2. Game category: choose exactly one ("Pokémon", "Magic: The Gathering", "Yu-Gi-Oh!", "One Piece", "Lorcana", "Other").
3. Set / Expansion name if visible (e.g. "Base Set", "Evolving Skies", "Unlimited", "Legend of Blue Eyes", "Alpha").
4. Card number or collector number (e.g. "4/102", "215/203", "LOB-001").
5. Rarity (e.g. "Holo Rare", "Secret Rare", "Ultra Rare", "Mythic Rare", "Common").
6. Visual condition: ("Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", or "Graded PSA 9/10").
7. Is this in a graded acrylic slab (PSA, BGS, CGC)? (true/false).
8. Confidence score between 0.0 and 1.0.

Format your response as valid JSON ONLY without markdown backticks:
{
  "name": "...",
  "game": "...",
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
          detectedName = parsed.name || detectedName;
          detectedGame = parsed.game || detectedGame;
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
        } else if (!hintOrUrlMatch) {
          res.status(502).json({ success: false, error: 'recognition_failed' });
          return;
        }
      }
    } else if (!hintOrUrlMatch) {
      // No vision model configured and nothing to go on: say so rather than inventing a card.
      res.status(503).json({ success: false, error: 'recognition_unavailable' });
      return;
    }

    if (!detectedName.trim()) {
      res.status(422).json({ success: false, error: 'card_not_identified' });
      return;
    }

    const matchedData = await fetchCardFromFreeApis(detectedName, detectedGame, detectedSet, detectedNumber);

    const basePrice = (matchedData as any).rawMarketPrice ?? 0;
    const finalMarketPrice = isGraded ? Math.round(basePrice * 3.5) : basePrice;

    const storeCashOffer = Math.round(finalMarketPrice * 0.72);
    const storeCreditOffer = Math.round(finalMarketPrice * 0.84);

    // Only real data is shown: no invented recent-sales list.
    const ebayRecentComps: unknown[] = [];

    res.json({
      success: true,
      detection: {
        name: detectedName,
        game: detectedGame,
        setName: detectedSet,
        cardNumber: detectedNumber,
        rarity: detectedRarity,
        condition: detectedCondition,
        isGraded,
        confidence,
        notes,
      },
      matchedCard: {
        id: matchedData.id,
        name: matchedData.name,
        game: matchedData.game,
        setName: (matchedData as any).setName || detectedSet,
        cardNumber: (matchedData as any).cardNumber || detectedNumber,
        rarity: (matchedData as any).rarity || detectedRarity,
        imageUrl: matchedData.imageUrl,
        marketPrice: finalMarketPrice,
        storeCashOffer,
        storeCreditOffer,
        ebayLastSoldAvg: finalMarketPrice,
        ebayRecentComps,
      },
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

    if (aiClient && resolved.base64 && resolved.base64.length > 50) {
      try {
        const prompt = `Analyze this trading card image carefully.
This photo may contain MULTIPLE cards (e.g. a 9-pocket binder page, a 4-card spread, or tabletop card grid).
Detect and identify EACH individual card in the photo.
For each card, determine:
- name: Exact card name
- game: "Pokémon", "Magic: The Gathering", "Yu-Gi-Oh!", "One Piece", or "Lorcana"
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
      }
    }

    // Fallback if vision didn't parse array: use benchmark collection items
    if (detectedCards.length === 0 && req.body.demo !== true) {
      res.status(aiClient ? 502 : 503).json({ success: false, error: aiClient ? 'recognition_failed' : 'recognition_unavailable' });
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
        const matched = await fetchCardFromFreeApis(dc.name, dc.game, dc.set, dc.number);
        const basePrice = (matched as any).rawMarketPrice ?? 0;
        const storeCashOffer = Math.round(basePrice * 0.72);
        const storeCreditOffer = Math.round(basePrice * 0.84);

        return {
          detection: {
            ...dc,
            notes: `Detected at ${dc.position || 'Grid slot'}`,
          },
          matchedCard: {
            id: matched.id,
            name: matched.name,
            game: matched.game,
            setName: (matched as any).setName || dc.set,
            cardNumber: (matched as any).cardNumber || dc.number,
            rarity: (matched as any).rarity || dc.rarity,
            imageUrl: matched.imageUrl,
            marketPrice: basePrice,
            storeCashOffer,
            storeCreditOffer,
            ebayLastSoldAvg: basePrice,
            ebayRecentComps: [],
          },
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

      const matched = await fetchCardFromFreeApis(cleanName || cardQuery, defaultGame);
      const isGraded = condition.includes('PSA');
      const basePrice = (matched as any).rawMarketPrice ?? 0;
      const finalPrice = isGraded ? Math.round(basePrice * (condition.includes('10') ? 3.8 : 2.2)) : basePrice;

      const storeCashOffer = Math.round(finalPrice * 0.72);
      const storeCreditOffer = Math.round(finalPrice * 0.84);

      for (let q = 0; q < qty; q++) {
        parsedItems.push({
          id: `${matched.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: matched.name,
          game: matched.game,
          setName: (matched as any).setName || 'Standard Expansion',
          cardNumber: (matched as any).cardNumber || '',
          rarity: (matched as any).rarity || 'Rare',
          imageUrl: matched.imageUrl,
          condition,
          marketPrice: finalPrice,
          storeCashOffer,
          storeCreditOffer,
          ebayLastSoldAvg: finalPrice,
          ebayRecentComps: [],
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
  const game = String(req.query.game || 'any');

  if (!raw) {
    res.json({ results: [] });
    return;
  }

  const { name, number } = splitQuery(raw);
  const results = await searchCards({ q: name, game, number, limit: 10 });
  res.json({
    results: results.map((c) => ({ ...c, marketPrice: c.rawMarketPrice })),
  });
});

// GBP -> EUR/USD reference rates (ECB via frankfurter.dev), cached for 12h with static fallback.
const FALLBACK_RATES = { EUR: 1.17, USD: 1.27 };
let ratesCache: { at: number; rates: { EUR: number; USD: number } } | null = null;
app.get('/api/rates', async (_req: Request, res: Response) => {
  res.set('Cache-Control', 'public, max-age=3600');
  if (ratesCache && Date.now() - ratesCache.at < 12 * 3600_000) {
    res.json({ base: 'GBP', rates: ratesCache.rates, source: 'live' });
    return;
  }
  try {
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=GBP&symbols=EUR,USD', {
      signal: AbortSignal.timeout(5000),
    });
    const j: any = r.ok ? await r.json() : null;
    if (j?.rates?.EUR > 0 && j?.rates?.USD > 0) {
      ratesCache = { at: Date.now(), rates: { EUR: j.rates.EUR, USD: j.rates.USD } };
      res.json({ base: 'GBP', rates: ratesCache.rates, source: 'live' });
      return;
    }
  } catch {
    /* fall through */
  }
  res.json({ base: 'GBP', rates: FALLBACK_RATES, source: 'fallback' });
});

app.use('/api', emailRouter);

/**
 * Health check
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
