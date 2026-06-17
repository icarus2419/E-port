# Joseph Portfolio + Multiplayer Poker

This version includes the live poker platform directly inside the ePortfolio.

## What changed

- The main project card `Play poker` button now points to `./poker/index.html` and the folder exists in this ZIP.
- The poker platform lives at `/poker/`.
- The multiplayer API routes live at `/api/` and are ready for Vercel serverless deployment.
- The poker page includes a fixed `← Back to Portfolio` button that returns to `../index.html#projects`.
- Poker audio assets are bundled in `/poker/audio/`.


## Vercel API route check

This ZIP includes all serverless route files used by the poker page:

```text
/api/health
/api/rooms
/api/rooms/create
/api/rooms/close
/api/state
/api/join
/api/add_ai
/api/start_hand
/api/next_hand
/api/action
/api/leave
/api/reset
/api/set_variant
/api/variance/demo
```

## Deploy

Upload this whole folder/repo to Vercel as one project. Do not deploy the poker ZIP separately.

For reliable real multiplayer on Vercel, add one of these env variable pairs in Vercel Project Settings:

- `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

Without Redis/KV, the API falls back to temporary serverless file storage, which is okay for a quick demo but not reliable across Vercel serverless instances.

## Local checks

```bash
npm run check:api
python3 -m http.server 3000
```

The Python static preview can show the pages, but multiplayer API calls require Vercel/serverless or a Node adapter.

# Joseph Doyle-Samadi ePortfolio + Playable Poker

This is the normal portfolio site with the poker platform available from the Projects section.

## Correct folder to deploy

Deploy this folder as the Vercel project root:

```text
Sitee/
```

The root must contain:

```text
index.html
assets/
project/
poker/
api/
package.json
vercel.json
```

## Poker flow

```text
Homepage → Projects → Poker Platform → Play poker → /poker/index.html
```

The poker page uses Vercel API routes in `api/` so players can create rooms, join seats, start hands, and play against other browser sessions.

Player-created rooms automatically expire after 4 hours. The default `MAIN01`
table stays available.

## Real multiplayer storage

For reliable multiplayer on Vercel, add Redis/KV storage and set:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

The API also accepts the Upstash names:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Without Redis, the app can open and play in preview using temporary file storage, but that storage is not durable or reliable between real visitors.

## Local preview

Static page-only preview:

```bash
cd Sitee
npm run preview
```

Then open:

```text
http://localhost:3000
```

For playable poker testing, use Vercel locally:

```bash
cd Sitee
npx vercel dev --local
```

Then open the local Vercel URL.

Useful poker checks:

```text
/poker/index.html
/api/health
/api/rooms
/api/variance/demo?variant=holdem&agent_a=ai_hard&agent_b=ai_medium&hands=100
```

## Vercel deployment instructions - IMPORTANT

This folder is the deploy root. When uploading or pushing to GitHub, the repository root must contain `index.html`, `assets/`, `poker/`, `api/`, `package.json`, and `vercel.json` directly. Do not commit the ZIP file itself and do not leave the project nested inside another folder.

### Correct GitHub/Vercel structure

```text
index.html
assets/
poker/
api/
package.json
vercel.json
README.md
```

### Vercel project settings

Use these settings in Vercel if it asks:

```text
Framework Preset: Other
Root Directory: ./
Build Command: empty / none
Output Directory: .
Install Command: default / empty
```

### Required for real multiplayer

Add one Redis/KV pair in Vercel Project Settings -> Environment Variables. Use Production, Preview, and Development if available.

Preferred Upstash names:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Alternative Vercel KV names also supported:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

Only one pair is needed. After adding them, redeploy the project.

### After deploy, test these URLs

```text
https://YOUR-SITE.vercel.app/
https://YOUR-SITE.vercel.app/poker/index.html
https://YOUR-SITE.vercel.app/api/health
https://YOUR-SITE.vercel.app/api/rooms
```

`/api/health` should return JSON. If it says `storage: "redis"`, real multiplayer storage is connected. If it says `temporary-file`, your environment variables are missing or wrong.

### What is wired

- Portfolio Projects -> Poker -> Play poker opens `./poker/index.html`.
- Poker page has `← Back to Portfolio` linking back to `../index.html#projects`.
- Multiplayer API routes live in `/api`.
- The poker page uses `/api/rooms/create`, `/api/join`, `/api/state`, `/api/action`, and the other Vercel serverless routes.
