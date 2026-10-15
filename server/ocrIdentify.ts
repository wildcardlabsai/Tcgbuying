/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Backup card identification from OCR text read in the browser (no AI service needed).
// Heuristics: the card name is printed in a band at the top of the card, the collector number
// (e.g. "4/102" or "LOB-005") at the bottom. We pull candidates from the text and let the catalogue decide.

export interface OcrParse {
  names: string[];
  number?: string;
  setCode?: string;
  gameHint: 'pokemon' | 'ygo' | 'any';
}

const NOISE_WORDS = new Set([
  'basic', 'stage', 'evolves', 'from', 'pokemon', 'pokémon', 'trainer', 'energy', 'item', 'supporter', 'stadium',
  'hp', 'weakness', 'resistance', 'retreat', 'illus', 'illustrator', 'creature', 'instant', 'sorcery', 'legendary',
  'artifact', 'enchantment', 'normal', 'monster', 'spell', 'trap', 'effect', 'level', 'atk', 'def',
]);

/** Remove OCR junk from a line, keeping letters, apostrophes, hyphens and spaces. */
function cleanLine(line: string): string {
  return line
    .replace(/\bHP\s*\d+|\d+\s*HP\b/gi, ' ')
    .replace(/\bHP\b/g, ' ')
    .replace(/\b(basic|stage\s*\d)\b/gi, ' ')
    .replace(/[^A-Za-zÀ-ÿ'’\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNameLike(s: string): boolean {
  const letters = s.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 3 || s.length > 40) return false;
  const words = s.toLowerCase().split(' ');
  if (words.every((w) => NOISE_WORDS.has(w))) return false;
  return true;
}

export function parseOcr(top: string, bottom: string, full = ''): OcrParse {
  const all = `${top}\n${bottom}\n${full}`;

  let number: string | undefined;
  let setCode: string | undefined;
  let gameHint: OcrParse['gameHint'] = 'any';

  const frac = all.match(/\b(\d{1,3})\s*\/\s*(\d{2,3})\b/);
  if (frac) {
    number = `${frac[1]}/${frac[2]}`;
    gameHint = 'pokemon';
  }
  const code = all.match(/\b([A-Z]{2,5})\s*-\s*([A-Z]{0,3}\d{2,4})\b/);
  if (code && !frac) {
    setCode = `${code[1]}-${code[2]}`;
    gameHint = 'ygo';
  }

  const names: string[] = [];
  // Name band first; then, for cards that did not fill the frame, any readable line in the whole photo.
  for (const raw of [...top.split(/\n+/), ...full.split(/\n+/)]) {
    const line = cleanLine(raw);
    if (!isNameLike(line)) continue;
    // Drop leading stray single characters OCR often adds ("e Charizard")
    const trimmed = line.replace(/^(?:[A-Za-z]\s)+/, '').trim();
    if (isNameLike(trimmed) && !names.includes(trimmed)) names.push(trimmed);
    if (names.length >= 5) break;
  }
  return { names, number, setCode, gameHint };
}
