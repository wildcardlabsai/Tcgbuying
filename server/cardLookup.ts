/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Pokémon card lookups against free public APIs:
//   pokemontcg.io -> https://docs.pokemontcg.io  (TCGplayer market prices and Cardmarket prices included)
//   TCGdex        -> https://tcgdex.dev  (fallback)
// Prices are converted to GBP with flat factors. TCGplayer's "market" price is derived from recent TCGplayer
// sales; it is a good guide but not eBay sold data.

export interface PriceVariant {
  key: string;
  label: string;
  /** GBP market price for this printing/finish. */
  price: number;
}

export interface CatalogCard {
  id: string;
  name: string;
  game: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  /** GBP market estimate for the default variant; 0 when no price is available. */
  rawMarketPrice: number;
  priceKnown: boolean;
  /** Where the main price comes from, and when that source last updated it. */
  priceSource: string;
  priceUpdated?: string;
  /** Low / high range reported by the source for the chosen variant (GBP). */
  priceLow?: number;
  priceHigh?: number;
  /** Printings/finishes with their own prices (holo, reverse holo, 1st edition ...). */
  variants: PriceVariant[];
  priceVariant: string;
  /** Cross-checks from other sources (GBP). */
  cardmarketPrice?: number;
  pricechartingPrice?: number;
  /** True when TCGplayer and Cardmarket differ a lot, so the dealer should check. */
  priceDisagree?: boolean;
  /** Product page on TCGplayer (direct when the source provides it, otherwise a search for the card). */
  tcgplayerUrl: string;
  /** Cardmarket product page, when the source provides one. */
  cardmarketUrl?: string;
  pricechartingUrl?: string;
  /** The catalogue page the match came from. */
  sourceUrl?: string;
}

// Pokémon only.
export type GameKey = 'pokemon';

const USD_GBP = 0.78;
const EUR_GBP = 0.86;
const TIMEOUT_MS = 7000;
const UA = 'TCGBuyer/1.0 (+https://tcgbuyer.xyz)';

/** TCGBuyer only deals in Pokémon cards, whatever game the caller asks for. */
export function normaliseGame(_game?: string): GameKey {
  return 'pokemon';
}

const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_MS = 15 * 60_000;

async function getJson(url: string, extraHeaders: Record<string, string> = {}): Promise<any | null> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json', 'User-Agent': UA, ...extraHeaders },
    });
    if (!res.ok) return null;
    const value = await res.json();
    cache.set(url, { at: Date.now(), value });
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    return value;
  } catch {
    return null;
  }
}

const tcgplayerSearch = (_game: 'pokemon', name: string) =>
  `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(name)}`;
const httpsOnly = (u: unknown) => (typeof u === 'string' && u.startsWith('https://') ? u : undefined);

const esc = (s: string) => s.replace(/["\\]/g, ' ').trim();
const money = (n: unknown, rate: number) => {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.round(v * rate * 100) / 100 : 0;
};

export interface SearchOpts {
  q: string;
  game?: string;
  set?: string;
  number?: string;
  limit?: number;
  /** Tolerate OCR typos: match on a name prefix instead of the full name. */
  fuzzy?: boolean;
}

/** Pull "4/102" or "#4" style collector numbers out of a free-text query. */
export function splitQuery(q: string): { name: string; number?: string } {
  const m = q.match(/#?\b(\d{1,3})\s*\/\s*\d{1,3}\b/);
  const name = q.replace(/#?\b\d{1,3}\s*\/\s*\d{1,3}\b/, ' ').replace(/\s+/g, ' ').trim();
  return { name: name || q.trim(), number: m ? m[1] : undefined };
}

// ---------- Pokémon ----------
const pokemonKeyHeader = (): Record<string, string> =>
  process.env.POKEMONTCG_API_KEY ? { 'X-Api-Key': process.env.POKEMONTCG_API_KEY } : {};

/** Name pattern for pokemontcg.io: exact, "starts with", or (for OCR) a shortened prefix to tolerate typos. */
function pokemonNameClause(o: SearchOpts, exactName: boolean): string {
  if (o.fuzzy) {
    const prefix = esc(o.q).slice(0, Math.max(4, esc(o.q).length - 2));
    return `name:"${prefix}*"`;
  }
  return `name:"${esc(o.q)}${exactName ? '' : '*'}"`;
}

async function searchPokemonTcgApi(o: SearchOpts, exactName: boolean): Promise<CatalogCard[]> {
  const number = o.number?.split('/')[0].replace(/^0+(?=\d)/, '');
  const build = (withSet: boolean, withNumber: boolean) => {
    const parts = [pokemonNameClause(o, exactName)];
    if (withNumber && number) parts.push(`number:"${esc(number)}"`);
    if (withSet && o.set) parts.push(`set.name:"${esc(o.set)}"`);
    return parts.join(' ');
  };
  const attempts: Array<[boolean, boolean]> = [[true, true], [false, true], [true, false], [false, false]];
  const seen = new Set<string>();
  for (const [withSet, withNumber] of attempts) {
    if ((withSet && !o.set) || (withNumber && !number)) continue;
    const key = build(withSet, withNumber);
    if (seen.has(key)) continue;
    seen.add(key);
    const url =
      'https://api.pokemontcg.io/v2/cards?pageSize=' +
      (o.limit ?? 8) +
      '&select=id,name,number,rarity,set,images,tcgplayer,cardmarket&orderBy=-set.releaseDate&q=' +
      encodeURIComponent(key);
    const json = await getJson(url, pokemonKeyHeader());
    if (json === null) return []; // timed out or errored: stop here rather than waiting on three more attempts
    const rows: any[] = json?.data || [];
    if (rows.length) return rows.map(mapPokemon);
  }
  return [];
}

/** Second Pokémon source (TCGdex): fast, no key. Used when pokemontcg.io is slow or down. */
async function searchTcgdex(o: SearchOpts): Promise<CatalogCard[]> {
  const number = o.number?.split('/')[0].replace(/^0+(?=\d)/, '');
  const name = o.fuzzy ? o.q.slice(0, Math.max(4, o.q.length - 2)) : o.q;
  const params = new URLSearchParams({ name });
  if (number) params.set('localId', number);
  const list = await getJson(`https://api.tcgdex.net/v2/en/cards?${params.toString()}`);
  if (!Array.isArray(list) || list.length === 0) return [];
  const details = await Promise.all(
    list.slice(0, o.limit ?? 6).map((r: any) => getJson(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(r.id)}`))
  );
  return details
    .filter(Boolean)
    .map((d: any): CatalogCard => {
      const tp = d.pricing?.tcgplayer || {};
      const variant = tp.holofoil || tp.normal || tp.reverseHolofoil || Object.values(tp).find((v: any) => v && typeof v === 'object');
      const price =
        money((variant as any)?.marketPrice ?? (variant as any)?.midPrice, USD_GBP) ||
        money(d.pricing?.cardmarket?.avg ?? d.pricing?.cardmarket?.trend, EUR_GBP);
      return {
        id: `tcgdex-${d.id}`,
        name: d.name,
        game: 'Pokémon',
        setName: d.set?.name || '',
        cardNumber: d.set?.cardCount?.official ? `${d.localId}/${d.set.cardCount.official}` : String(d.localId || ''),
        rarity: d.rarity || '',
        imageUrl: d.image ? `${d.image}/high.webp` : '',
        rawMarketPrice: price,
        priceKnown: price > 0,
        priceSource: price > 0 ? 'TCGdex (TCGplayer / Cardmarket)' : '',
        variants: [],
        priceVariant: '',
        tcgplayerUrl: tcgplayerSearch('pokemon', `${d.name} ${d.localId || ''}`.trim()),
        sourceUrl: `https://www.tcgdex.net/cards/en/${encodeURIComponent(d.id)}`,
      };
    });
}

/** Both sources in parallel; pokemontcg.io wins when it answers (it carries TCGplayer links and prices). */
async function searchPokemon(o: SearchOpts, exactName: boolean): Promise<CatalogCard[]> {
  const [primary, fallback] = await Promise.all([
    searchPokemonTcgApi(o, exactName).catch(() => [] as CatalogCard[]),
    searchTcgdex(o).catch(() => [] as CatalogCard[]),
  ]);
  return primary.length ? primary : fallback;
}

const VARIANT_LABELS: Record<string, string> = {
  normal: 'Non-holo',
  holofoil: 'Holo',
  reverseHolofoil: 'Reverse holo',
  '1stEditionHolofoil': '1st Edition holo',
  '1stEditionNormal': '1st Edition',
  unlimitedHolofoil: 'Unlimited holo',
  unlimitedNormal: 'Unlimited',
};

/** Which finish a card most likely has, used to pick the default price when a card has several. */
function variantOrder(rarity: string): string[] {
  const holoFirst = /holo|ex\b|\bv\b|vmax|vstar|gx|illustration|secret|ultra|hyper|shiny|radiant|amazing|special/i.test(rarity);
  return holoFirst
    ? ['holofoil', 'unlimitedHolofoil', '1stEditionHolofoil', 'normal', 'unlimitedNormal', '1stEditionNormal', 'reverseHolofoil']
    : ['normal', 'unlimitedNormal', '1stEditionNormal', 'holofoil', 'unlimitedHolofoil', '1stEditionHolofoil', 'reverseHolofoil'];
}

function mapPokemon(p: any): CatalogCard {
  const prices = p.tcgplayer?.prices || {};
  const variants: PriceVariant[] = Object.keys(prices)
    .map((key) => ({ key, label: VARIANT_LABELS[key] || key, price: money(prices[key]?.market ?? prices[key]?.mid, USD_GBP) }))
    .filter((v) => v.price > 0);
  const chosenKey = variantOrder(p.rarity || '').find((k) => variants.some((v) => v.key === k)) || variants[0]?.key || '';
  const chosen = variants.find((v) => v.key === chosenKey);
  const cardmarket = money(p.cardmarket?.prices?.averageSellPrice ?? p.cardmarket?.prices?.trendPrice, EUR_GBP);

  let price = chosen?.price ?? 0;
  let source = chosen ? 'TCGplayer' : '';
  if (!price && cardmarket) {
    price = cardmarket;
    source = 'Cardmarket';
  }
  const disagree = Boolean(chosen && cardmarket) && (chosen!.price / cardmarket > 1.4 || chosen!.price / cardmarket < 0.7);
  return {
    id: `pkmn-${p.id}`,
    name: p.name,
    game: 'Pokémon',
    setName: p.set?.name || '',
    cardNumber: p.set?.printedTotal ? `${p.number}/${p.set.printedTotal}` : String(p.number || ''),
    rarity: p.rarity || '',
    imageUrl: p.images?.large || p.images?.small || '',
    rawMarketPrice: price,
    priceKnown: price > 0,
    priceSource: source,
    priceUpdated: chosen ? p.tcgplayer?.updatedAt : p.cardmarket?.updatedAt,
    priceLow: chosen ? money(prices[chosenKey]?.low, USD_GBP) || undefined : undefined,
    priceHigh: chosen ? money(prices[chosenKey]?.high, USD_GBP) || undefined : undefined,
    variants,
    priceVariant: chosenKey,
    cardmarketPrice: cardmarket || undefined,
    priceDisagree: disagree || undefined,
    tcgplayerUrl: httpsOnly(p.tcgplayer?.url) || tcgplayerSearch('pokemon', `${p.name} ${p.number || ''}`.trim()),
    cardmarketUrl: httpsOnly(p.cardmarket?.url),
    sourceUrl: `https://pokemontcg.io/card-search?q=${encodeURIComponent(p.id)}`,
  };
}

/** Edit-distance similarity from 0 to 1; lets slightly misread OCR names still rank sensibly. */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - dp[a.length][b.length] / Math.max(a.length, b.length);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function score(c: CatalogCard, o: SearchOpts): number {
  let s = 0;
  const want = norm(o.q);
  const got = norm(c.name);
  s += similarity(got, want) * 4;
  if (got === want) s += 10;
  else if (got.startsWith(want) || want.startsWith(got)) s += 5;
  else if (got.includes(want) || want.includes(got)) s += 2;
  if (o.set && norm(c.setName) === norm(o.set)) s += 6;
  else if (o.set && norm(c.setName).includes(norm(o.set))) s += 3;
  const num = o.number?.split('/')[0].replace(/^0+(?=\d)/, '');
  if (num && c.cardNumber.split('/')[0].replace(/^0+(?=\d)/, '') === num) s += 6;
  if (c.priceKnown) s += 0.5;
  return s;
}

/**
 * Search the catalogue. `exactName` is for resolving a detected card; false is for a user typing in a search box.
 * Results are ranked by closeness to the query/set/number.
 */
export async function searchCards(o: SearchOpts, exactName = false): Promise<CatalogCard[]> {
  const q = o.q.trim();
  if (!q) return [];
  const opts = { ...o, q };
  const results = await searchPokemon(opts, exactName).catch(() => [] as CatalogCard[]);
  return results
    .map((c) => ({ c, s: score(c, opts) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c)
    .slice(0, o.limit ?? 8);
}

/** Best single catalogue match for a detected card, or null. */
export async function findBestMatch(
  name: string,
  game: string,
  set?: string,
  number?: string
): Promise<CatalogCard | null> {
  const { name: clean, number: inlineNumber } = splitQuery(name);
  const hits = await searchCards({ q: clean, game, set, number: number || inlineNumber, limit: 6 }, true);
  return hits[0] ?? null;
}

/** Ranked catalogue matches for a detected card (best first). */
export async function findMatches(
  name: string,
  game: string,
  set?: string,
  number?: string,
  limit = 6,
  fuzzy = false
): Promise<CatalogCard[]> {
  const { name: clean, number: inlineNumber } = splitQuery(name);
  return searchCards({ q: clean, game, set, number: number || inlineNumber, limit, fuzzy }, true);
}
