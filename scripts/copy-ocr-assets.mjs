// Copies the browser OCR engine (tesseract.js worker, wasm cores, English data) into public/ocr so it is
// served from our own domain instead of a third-party CDN. Runs before dev and build.
import { cpSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'public/ocr';
const core = 'node_modules/tesseract.js-core';
const lang = 'node_modules/@tesseract.js-data/eng/4.0.0_best_int';

if (!existsSync(core) || !existsSync(lang)) {
  console.warn('[ocr] tesseract packages not installed; skipping OCR asset copy');
  process.exit(0);
}
mkdirSync(join(out, 'lang'), { recursive: true });
cpSync('node_modules/tesseract.js/dist/worker.min.js', join(out, 'worker.min.js'));
for (const f of readdirSync(core)) {
  // Only the LSTM cores are needed for the default engine.
  if (/^tesseract-core.*lstm\.(js|wasm\.js)$/.test(f)) cpSync(join(core, f), join(out, f));
}
for (const f of readdirSync(lang)) cpSync(join(lang, f), join('public/ocr/lang', f));
console.log('[ocr] assets copied to public/ocr');
