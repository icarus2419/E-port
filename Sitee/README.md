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

Without Redis, the app can open for preview, but shared state is only temporary memory and is not reliable between real visitors.

## Local preview

Static page preview:

```bash
cd Sitee
python3 -m http.server 3000
```

Then open:

```text
http://localhost:3000
```

For API-route testing, use Vercel locally:

```bash
cd Sitee
npm install -g vercel
vercel dev
```

Then open the local Vercel URL.
