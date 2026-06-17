# Sitee Portfolio + Multiplayer Poker

This is the Vercel-ready ePortfolio with the playable poker platform embedded.

## What is included

- Portfolio homepage at `/`.
- Poker platform at `/poker/index.html`.
- Portfolio Projects -> Poker -> Play poker opens the poker platform.
- Poker page has `← Back to Portfolio`, returning to `../index.html#projects`.
- Multiplayer backend uses one Vercel catch-all function: `/api/[...poker].js`.
- Shared poker backend logic lives in `/lib/poker.js`.
- This avoids Vercel Hobby's 12 Serverless Function limit.

## Correct deploy root

Deploy the `Sitee` folder contents as your Vercel/GitHub project root.

The root must contain these directly:

```text
index.html
assets/
poker/
api/
lib/
package.json
vercel.json
README.md
```

Do not deploy a repo shaped like this unless Vercel Root Directory is set to `Sitee`:

```text
E-port/
  Sitee/
    index.html
```

Cleaner GitHub structure:

```text
E-port/
  index.html
  assets/
  poker/
  api/
  lib/
  package.json
  vercel.json
  README.md
```

## Vercel settings

Use these settings if Vercel asks:

```text
Framework Preset: Other
Root Directory: ./
Build Command: empty / none
Output Directory: .
Install Command: default / empty
```

## Multiplayer storage

For reliable multiplayer between real visitors, add one Redis/KV pair in:

```text
Vercel Project -> Settings -> Environment Variables
```

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

Only one pair is needed. Select Production, Preview, and Development if available. Redeploy after saving.

Without Redis/KV, the site still deploys and the poker can demo, but real multiplayer is not durable because Vercel serverless storage is temporary.

## Local checks

```bash
npm run check:api
```

Expected result:

```text
Poker API smoke test passed with single Vercel function
```

Static preview:

```bash
npm run preview
```

## Test after deployment

Replace `YOUR-SITE` with the Vercel URL:

```text
https://YOUR-SITE.vercel.app/
https://YOUR-SITE.vercel.app/poker/index.html
https://YOUR-SITE.vercel.app/api/health
https://YOUR-SITE.vercel.app/api/rooms
https://YOUR-SITE.vercel.app/api/variance/demo?hands=50
```

`/api/health` should return JSON. If it says `storage: "redis"`, real multiplayer storage is connected. If it says `temporary-file`, the env vars are missing or wrong.


## Hero video assets

The homepage video button uses the original uploaded `assets/drive-loop.mp4` with `assets/drive-loop-poster.jpg` as the poster. Keep `drive-loop.mp4`, `drive-loop-poster.jpg`, `scene.png`, and `car.png` inside `assets/` when uploading to GitHub/Vercel.

## Vercel Hobby API note

This build uses exactly one physical serverless API file for the poker backend:

```text
api/poker.js
```

`vercel.json` rewrites `/api/health`, `/api/rooms/create`, `/api/join`, and the other poker endpoints into that single file. This keeps the deployment under the Vercel Hobby serverless function limit while keeping the frontend API URLs unchanged.

Do not restore the older separate API files such as `api/action.js`, `api/join.js`, `api/rooms/create.js`, or `api/variance/demo.js`, or Vercel Hobby may fail again.
