# TCGBuyer

Buying software for trading card shops: each dealer gets a customer buying portal
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
- Card values are estimates from public sources (Pokémon TCG API, Scryfall, YGOPRODeck) converted with a flat factor, not live eBay sold data.
- `LegalModal.tsx` holds draft Terms and Privacy text. Have it reviewed by a professional and add your company details before launch.
