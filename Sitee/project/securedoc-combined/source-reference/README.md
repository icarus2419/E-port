# SecureDoc — combined landing + approval app

This project combines two pieces into one runnable app served by a single Express server:

- **Marketing landing (frontend)** — a React/Vite product landing experience
  **rewritten to showcase SecureDoc**. Warm cream / deep-red /
  amber palette, Poppins + Libre Baskerville + IBM Plex Mono. Served at **`/`**.
- **Approval app + backend** — the *Secure Document Approval* Express backend and its
  single-page app, **re-skinned to the same warm palette and design**. Role-based access,
  uploads, SHA-256 fingerprints, reviewer decisions, approval receipts, and a tamper-evident
  audit trail. Served at **`/app`**, with the JSON API under **`/api`**.

```
/            -> marketing landing  (landing-dist/, prebuilt from landing-src/)
/app, /app/* -> the SecureDoc app  (public/)
/api/*       -> backend API        (server.js)
```

## Run locally

```bash
npm install
npm start
```

Then open:

- Landing:  http://localhost:8787/
- App:      http://localhost:8787/app

The landing's "Open the demo app" / pricing buttons link to `/app`. Inside the app, the
SecureDoc brand (top-left) and the "Back to site" link return to `/`.

## Demo accounts

All demo accounts use the password `demo123`:

- `employee@demo.com`  — upload, draft, submit, track status
- `reviewer@demo.com`  — review assigned pending documents (approve / request changes / reject)
- `admin@demo.com`     — see and control everything

Demo data is fictional. Sessions expire after 2 hours. Every login is recorded in the audit trail.

## Project layout

- `server.js` — Express server: serves the landing at `/`, the app at `/app`, the API at `/api`.
- `public/` — the re-skinned SecureDoc single-page app (`index.html`, `app.js`, `styles.css`, `favicon.svg`).
- `landing-dist/` — the **prebuilt** marketing landing. This is what is served at `/`, so no build
  step is required to run the app.
- `landing-src/` — the React/Vite source for the landing (rewritten to showcase SecureDoc). Only
  needed if you want to change the landing and rebuild it.
- `data/db.json` — seeded demo data (users, documents, audit events).
- `uploads/` — where uploaded files are stored at runtime.

## Rebuilding the landing (optional)

Only needed if you edit anything in `landing-src/`:

```bash
cd landing-src
npm install
cd ..
npm run build:landing   # builds landing-src and copies the output into landing-dist/
```

## Notes

- `node_modules` is not included; run `npm install` first.
- The app is a demo environment. CORS allows same-origin and any localhost port; for a real
  deployment, set `CORS_ORIGINS` to your domain(s).
- Default port is `8787` (override with the `PORT` environment variable).
