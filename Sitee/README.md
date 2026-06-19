# Sitee Portfolio + Multiplayer Poker

This is the Vercel-ready ePortfolio with the playable poker platform embedded.

## What is included

- Portfolio homepage at `/`.
- Poker platform at `/poker/index.html`.
- Portfolio Projects -> Poker -> Play poker opens the poker platform.
- Poker page has `← Back to Portfolio`, returning to `../index.html#projects`.
- Multiplayer backend uses one Vercel Hobby-safe function: `/api/poker.js`.
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

## Latest multiplayer stability fixes

This version fixes the tab-switch/table deletion bugs:

- Switching browser tabs no longer leaves your seat.
- Leaving a seat no longer deletes a private table immediately.
- Private table expiry is now based on recent activity and lasts 24 hours.
- Player seat tokens are saved per room instead of one global token, so changing rooms/tabs does not wipe the wrong seat.
- The poker page shows a storage warning if Redis/KV is not connected.
- Redis-backed writes now use a small table lock so two friends joining or acting at nearly the same time do not overwrite each other.

Important: on Vercel, real two-person multiplayer still requires Redis/KV. If `/api/health` says `storage: "temporary-file"`, Vercel can move requests between serverless instances and a private table may appear to vanish. That is a hosting storage limitation, not the UI. Add the Redis env vars and redeploy.

## Music fix

The poker music now starts from a real user gesture instead of relying on deployed autoplay. If the browser blocks autoplay, click `Start Music` in the Sound panel once. Music resumes when returning to the tab.

## Local checks

Quick API smoke test:

```bash
npm run check:api
```

Full multiplayer audit:

```bash
npm run check:multiplayer
```

Expected results include:

```text
Poker API smoke test passed with single Vercel function

{
  "ok": true,
  "checked": [
    "two human players join same table",
    "simulated tab switch does not leave/delete",
    "leave seat does not delete room"
  ]
}

{
  "ok": true,
  "checked": "six concurrent joins remain seated"
}
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
## Poker audio deployment note

The poker page uses root-stable audio paths (`/poker/audio/...`) on deployed sites so Vercel clean URLs do not break music or sound effects when `/poker/index.html` is served as `/poker`. The audio still falls back to relative `./audio/...` for direct local `file://` previews.


## Redis / Upstash usage behavior

The poker app only calls Redis through Vercel API routes when the poker page is open and visible, or when a user performs an action such as creating a room, sitting, betting, folding, or refreshing rooms. The main portfolio page does not poll Redis.

To reduce free-tier command usage, poker polling pauses automatically when the poker browser tab is hidden and resumes when the tab becomes visible again. This does not remove the player from the table.

Expected Redis commands come from:

- loading `/api/health` or `/api/rooms`
- opening the poker page
- visible poker tabs polling room state
- players creating/joining/acting at a table
- Vercel preview/custom-domain checks that you manually open

If nobody has the poker page open, the app is not designed to continuously call Redis.

## Mobile and Redis usage notes

The poker page is optimized for mobile screens and Vercel Hobby. It uses a single serverless API function (`api/poker.js`). Redis is only touched by the poker page while the page is open and visible. Hidden tabs pause polling, lobby auto-refresh is disabled except for manual/important updates, and state polling is read-only so it does not write to Redis unless a real action happens.


## Latest poker fixes

This build keeps the Vercel Hobby-safe single API function (`api/poker.js`) and adds:

- Join Room now automatically seats the current browser/player in the first open seat.
- Create Room automatically seats the creator.
- A browser/client can create only one private room at a time. Creating again returns the existing room instead of making a second one.
- If a player joins/leaves/adds a bot during an active hand, the hand is safely cancelled and refunded so nobody is stuck in a no-cards/stale-hand state.
- Browser client recovery restores the correct seat token if local room/token storage gets out of sync.
- Hidden tabs still pause polling so Redis/API usage stays low.
- `api/` must contain only `api/poker.js` for Vercel Hobby.

After deploying, `/api/health` should show `"storage":"redis"` when Upstash/Vercel KV is connected.


## Final optimization notes

- The poker app uses one Vercel Hobby-safe API function: `api/poker.js`.
- Room state polling is read-only and does not write to Redis on every refresh.
- Polling pauses completely when the poker tab is hidden, without removing the player from the table.
- Visible active hands poll faster for gameplay responsiveness; waiting/idle rooms poll much slower to reduce Upstash usage.
- Join Room and Create Room automatically seat the player.
- One browser/player can only create one private room at a time.
- The desktop lobby and controls are sticky/scrollable; mobile layout uses compact touch-friendly table controls.


## Low Redis usage presence settings

The poker client sends a lightweight presence heartbeat every 30 minutes while seated. Closed-tab seats are cleared after about 90 minutes by default. Active gameplay still polls room state so players can see actions without manual refresh.
