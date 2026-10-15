# TCGBuyer

Buying software for Pokémon card shops: each dealer gets a customer buying portal
(`/?shop=<slug>`) and a dashboard for reviewing submissions and sending offers.

## Run locally

```bash
npm install
cp .env.example .env     # add GEMINI_API_KEY
npm run dev              # http://localhost:3000
npm run lint             # type-check
npm run build            # production bundle in dist/
```

## Data modes

| Mode | `VITE_DATA_MODE` | Where data lives | Notes |
| --- | --- | --- | --- |
| Local (default) | `local` | Browser `localStorage` | Demo only: one device, no real security, no Google sign-in, no password reset, no emails. |
| Firebase | `firebase` | Firebase Auth + Firestore | Real accounts, shared data across devices. |

### Switching to Firebase (project `epicfuryproj`)
1. Firebase console → Authentication → Sign-in method: enable **Email/Password** and **Google**.
2. Authentication → Settings → Authorised domains: add your Vercel/custom domain.
3. Firestore (database id in `firebase-applet-config.json`) → Rules: publish `firestore.rules`
   (or `firebase deploy --only firestore:rules`).
4. In Vercel set `VITE_DATA_MODE=firebase` and redeploy.

## Deploying to Vercel
- Frontend: Vite build (`npm run build`, output `dist/`).
- API: all `/api/*` routes are one Express app (`server/app.ts`) exposed by `api/index.ts` and rewritten in `vercel.json`.
- Set the environment variables listed in `.env.example`.
- Vercel limits request bodies to ~4.5 MB; photos are downscaled in the browser before upload.

## Notes
- Card values come from TCGplayer market prices (via the Pokémon TCG API, with TCGdex as a fallback) and are cross-checked against Cardmarket, converted with a flat factor. They are not eBay sold prices (eBay's sold-data API is restricted to approved partners). 
- `LegalModal.tsx` holds draft Terms and Privacy text. Have it reviewed by a professional and add your company details before launch.

## Photo recognition
1. **AI (Gemini):** set `GEMINI_API_KEY`. Check it at `/api/ai-status` (returns `ok: true`, or the reason: `quota`, `invalid_key`, `no_key`).
   Gemini requires a project with available credits or free-tier quota; a project whose prepaid balance is empty is rejected (HTTP 402).
2. **Backup (no key needed):** if the AI is unavailable, the browser reads the printed card name and number with OCR
   (tesseract.js, served from `/ocr`, copied at build time by `scripts/copy-ocr-assets.mjs`) and looks the card up in the free catalogues.
   It is less accurate, so matches from this mode show a lower confidence and the collector is asked to confirm.

## eBay sold prices (SoldComps)
Dealers can check recent eBay sold prices for a card (raw or PSA/BGS/CGC graded) from the Price Guide and from any submitted card.
Set `SOLD_COMPS_API_KEY` (from https://sold-comps.com; the free plan is 100 lookups a month). Behaviour:
- One lookup is one SoldComps request. Results are cached for a day, the allowance is checked first (free `/usage` call), and a few requests are always kept spare.
- Sales are from the last 90 days on eBay UK (shop currency GBP) or eBay US (otherwise), restricted to the Pokémon single-cards category.
  Lots, proxies, other cards, the wrong grade and outliers are removed. Best Offer sales report the asking price, so they are left out unless `SOLD_COMPS_HYDRATE_BOA=true`.
- Lookups are limited per signed-in dealer. Without Firebase sign-in they are limited per IP and across the site; set `SOLD_COMPS_REQUIRE_AUTH=true` once dealers sign in with Firebase.
- `/api/sold-status` shows whether it is set up and how many lookups remain.
