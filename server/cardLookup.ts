/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Card catalogue lookups against free public APIs:
//   Pokémon  -> https://docs.pokemontcg.io  (TCGplayer / Cardmarket prices included)
//   Magic    -> https://scryfall.com/docs/api
//   Yu-Gi-Oh -> https://ygoprodeck.com/api-guide
// Prices are converted to GBP with flat factors; they are estimates, not live sold data.

export interface CatalogCard {
  id: string;
  name: string;
  game: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  /** GBP estimate; 0 when no price is available. */
  rawMarketPrice: number;
  priceKnown: boolean;
}

export type GameKey = 'pokemon' | 'mtg' | 'ygo' | 'any';

const USD_GBP = 0.78;
const EUR_GBP = 0.86;
const TIMEOUT_MS = 7000;
const UA = 'TCGBuyer/1.0 (+https://tcgbuying.vercel.app)';

export function normaliseGame(game?: string): GameKey {
  const g = (game || '').toLowerCase();
  if (g.includes('pok')) return 'pokemon';
  if (g.includes('magic') || g.includes('mtg')) return 'mtg';
  if (g.includes('yu') || g.includes('ygo')) return 'ygo';
  return 'any';
}

const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_MS = 15 * 60_000;

async function getJson(url: string): Promise<any | null> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json', 'User-Agent': UA },
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
}

/** Pull "4/102" or "#4" style collector numbers out of a free-text query. */
export function splitQuery(q: string): { name: string; number?: string } {
  const m = q.match(/#?\b(\d{1,3})\s*\/\s*\d{1,3}\b/);
  const name = q.replace(/#?\b\d{1,3}\s*\/\s*\d{1,3}\b/, ' ').replace(/\s+/g, ' ').trim();
  return { name: name || q.trim(), number: m ? m[1] : undefined };
}

// ---------- Pokémon ----------
async function searchPokemon(o: SearchOpts, exactName: boolean): Promise<CatalogCard[]> {
  const number = o.number?.split('/')[0].replace(/^0+(?=\d)/, '');
  const build = (withSet: boolean, withNumber: boolean) => {
    const parts = [`name:"${esc(o.q)}${exactName ? '' : '*'}"`];
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
    const json = await getJson(url);
    const rows: any[] = json?.data || [];
    if (rows.length) return rows.map(mapPokemon);
  }
  return [];
}

function mapPokemon(p: any): CatalogCard {
  const prices = p.tcgplayer?.prices || {};
  const order = ['holofoil', '1stEditionHolofoil', 'unlimitedHolofoil', 'reverseHolofoil', 'normal', '1stEditionNormal', 'unlimitedNormal'];
  let price = 0;
  for (const k of order) {
    price = money(prices[k]?.market ?? prices[k]?.mid, USD_GBP);
    if (price) break;
  }
  if (!price) price = money(p.cardmarket?.prices?.averageSellPrice ?? p.cardmarket?.prices?.trendPrice, EUR_GBP);
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
  };
}

// ---------- Magic: The Gathering ----------
async function searchMtg(o: SearchOpts, exactName: boolean): Promise<CatalogCard[]> {
  const q = exactName ? `!"${esc(o.q)}"` : esc(o.q);
  const json = await getJson(
    `https://api.scryfall.com/cards/search?unique=prints&order=released&dir=desc&q=${encodeURIComponent(q)}`
  );
  let rows: any[] = json?.data || [];
  if (!rows.length && exactName) {
    const fuzzy = await getJson(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(o.q)}`);
    if (fuzzy?.id) rows = [fuzzy];
  }
  if (o.set) {
    const wanted = o.set.toLowerCase();
    rows.sort((a, b) => Number(b.set_name?.toLowerCase() === wanted) - Number(a.set_name?.toLowerCase() === wanted));
  }
  return rows.slice(0, o.limit ?? 8).map((c) => {
    const price = money(c.prices?.usd ?? c.prices?.usd_foil ?? c.prices?.usd_etched, USD_GBP);
    return {
      id: `mtg-${c.id}`,
      name: c.name,
      game: 'Magic: The Gathering',
      setName: c.set_name || '',
      cardNumber: c.collector_number || '',
      rarity: c.rarity ? c.rarity.charAt(0).toUpperCase() + c.rarity.slice(1) : '',
      imageUrl: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || '',
      rawMarketPrice: price,
      priceKnown: price > 0,
    };
  });
}

// ---------- Yu-Gi-Oh! ----------
async function searchYgo(o: SearchOpts, exactName: boolean): Promise<CatalogCard[]> {
  const param = exactName ? 'name' : 'fname';
  let json = await getJson(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${param}=${encodeURIComponent(o.q)}`);
  if (!json?.data && exactName) {
    json = await getJson(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(o.q)}`);
  }
  const out: CatalogCard[] = [];
  for (const card of (json?.data || []).slice(0, o.limit ?? 8)) {
    const price = money(card.card_prices?.[0]?.tcgplayer_price, USD_GBP);
    const sets: any[] = card.card_sets || [];
    const wanted = o.set?.toLowerCase();
    const set = (wanted && sets.find((s) => s.set_name?.toLowerCase() === wanted)) || sets[0];
    out.push({
      id: `ygo-${card.id}`,
      name: card.name,
      game: 'Yu-Gi-Oh!',
      setName: set?.set_name || '',
      cardNumber: set?.set_code || '',
      rarity: set?.set_rarity || '',
      imageUrl: card.card_images?.[0]?.image_url || '',
      rawMarketPrice: price,
      priceKnown: price > 0,
    });
  }
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function score(c: CatalogCard, o: SearchOpts): number {
  let s = 0;
  const want = norm(o.q);
  const got = norm(c.name);
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
  const game = normaliseGame(o.game);
  const jobs: Promise<CatalogCard[]>[] = [];
  if (game === 'pokemon' || game === 'any') jobs.push(searchPokemon(opts, exactName));
  if (game === 'mtg' || game === 'any') jobs.push(searchMtg(opts, exactName));
  if (game === 'ygo' || game === 'any') jobs.push(searchYgo(opts, exactName));
  const results = (await Promise.all(jobs.map((j) => j.catch(() => [] as CatalogCard[])))).flat();
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
