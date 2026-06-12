# Joseph Doyle-Samadi ePortfolio

Static ePortfolio for `josephsamadi.uk`, built with plain HTML, CSS, and JavaScript.

## Repo layout

```text
index.html
assets/
  styles.css
  script.js
project/
  poker-platform/
  coming-soon-1/
  coming-soon-2/
vercel.json
```

## Run locally

From the project root:

```bash
python3 -m http.server 3000
```

Then open `http://localhost:3000`.

## Deploy on Vercel

This project is configured as a static site in `vercel.json`:

- Framework preset: `Other`
- Build command: skipped
- Output directory: project root (`.`)

Connect the GitHub repository to Vercel once. After that, every push to the production branch will trigger a deployment automatically.

## Notes

Keep `index.html`, `assets/`, `project/`, all favicon files, and `vercel.json` at the repository root. Do not upload the old wrapper folder or `__MACOSX` files.
