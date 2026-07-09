# Full SEO Audit Report: josephsamadi.uk

- **Audit date:** July 9, 2026
- **Homepage:** https://josephsamadi.uk/
- **Site type:** Personal software engineering portfolio
- **Pages checked:** 6 sitemap URLs, plus homepage parse and rendered screenshots
- **Overall SEO Health Score:** **72/100**

## Executive Summary

The site has a solid technical SEO foundation: the live homepage returns HTTP 200, robots.txt allows crawling, the XML sitemap is discoverable, all sitemap URLs checked returned HTTP 200, core metadata exists, the homepage has a self-referencing canonical, and JSON-LD is present.

The main opportunities are trust/authority signals, AI-citable structure, security headers, metadata length cleanup, and first-visit visual behavior. The homepage is indexable and crawlable, but it does not yet explain Joseph's authorship, credentials, and project proof in a way that search engines or AI answer systems can easily extract.

## Score Breakdown

| Category | Score |
|----------|-------|
| Technical SEO | **85/100** |
| Content Quality | **46/100** |
| On-Page SEO | **87/100** |
| Schema / Structured Data | **84/100** |
| Performance | **65/100** |
| AI Search Readiness | **58/100** |
| Images | **86/100** |
| **Overall** | **72/100** |

## Top Priorities

1. Add visible author/founder attribution and stronger trust signals on the homepage.
2. Add missing security headers in `vercel.json`.
3. Add `WebPage` and `Organization` schema or strengthen the existing `Person` graph around the page entity.
4. Shorten long titles/meta descriptions on project pages.
5. Adjust the first-visit lamp intro so captured/rendered content is not heavily obscured.

## Technical SEO

### What Is Working

- `robots.txt` returns 200, allows all crawlers, and references `https://josephsamadi.uk/sitemap.xml`.
- `sitemap.xml` returns 200 and includes the homepage, 3D portfolio, poker, and three project pages.
- All sitemap URLs checked returned HTTP 200.
- The homepage canonical is self-referencing: `https://josephsamadi.uk/`.
- Critical SEO content is present in initial HTML, not hidden behind a client-only shell.
- HTTPS and HSTS are active on Vercel.

### Issues

- Only `strict-transport-security` was detected from the baseline security header set. Missing: `content-security-policy`, `x-frame-options`, `x-content-type-options`, and `referrer-policy`.
- All sitemap `lastmod` values are identical (`2026-07-08`). If every listed page was genuinely updated together, this is fine; otherwise, page-specific dates would be more trustworthy.
- IndexNow was not detected. This is low priority for a portfolio, but useful if faster Bing discovery matters.

### Recommendations

- Add HTML-route security headers in `vercel.json`.
- Keep the sitemap limited to canonical, indexable, 200-status pages.
- Only update `lastmod` when page content meaningfully changes.

## Content Quality

### Findings

- Homepage visible word count is about 540 words, which is acceptable for a portfolio homepage.
- The content shows technical depth through projects, skills, and experience.
- The weak area is E-E-A-T-style attribution: the page does not clearly label Joseph as the author/founder/owner of the portfolio in visible body copy.
- Trust signals are present through GitHub, LinkedIn, email, project pages, and schema, but they are spread out rather than framed as credibility signals.

### Recommendations

- Add a short "About this portfolio" or author block near the About/Experience area with Joseph's role, current focus, GitHub/LinkedIn, and last updated date.
- Add concise proof points to each project card: measurable result, technical constraint, or user-facing outcome.
- Add one self-contained paragraph that answers "Who is Joseph Doyle-Samadi and what does he build?" in 120-160 words.

## On-Page SEO

### Findings

- Homepage title length is good at 39 characters.
- Homepage meta description is long at 189 characters.
- Two checked pages have titles longer than 60 characters:
  - `/project/poker-platform/` at 63 characters.
  - `/project/nosite-leads/` at 83 characters.
- Four checked pages have meta descriptions longer than 160 characters:
  - `/` at 189 characters.
  - `/project/nosite-leads/` at 218 characters.
  - `/project/securedoc-combined/` at 173 characters.
  - One duplicate homepage crawl row from the sitemap/root merge.

### Recommendations

- Keep page titles near 50-60 characters where practical.
- Trim descriptions to roughly 150-160 characters while preserving the strongest differentiator.
- Keep one clear H1 per page; current homepage H1 structure is acceptable.

## Schema & Structured Data

### Findings

- Homepage has valid JSON-LD with `Person` and `WebSite`.
- No invalid JSON-LD blocks were detected.
- Recommended types missing for the homepage: `WebPage` and `Organization`.

### Recommendations

- Add a `WebPage` node connected to `#website` and `#person`.
- For a personal portfolio, `Organization` is optional. If added, avoid pretending there is a company unless Joseph wants to present a freelance/business entity. A stronger alternative is a richer `Person` graph with `mainEntityOfPage`.

## Performance

### Findings

- Performance score: 65/100 from deterministic heuristics.
- Heuristic Core Web Vitals:
  - LCP: 1.85s, good.
  - INP: 252ms, above the 200ms target.
  - CLS: 0.030, good.
- PageSpeed, CrUX, GSC, and GA4 credentials were not configured, so this is not field data.
- The homepage loads multiple CSS files, Google Fonts, Vercel Analytics, and several JS modules.

### Recommendations

- Re-run with a PageSpeed API key or Chrome Lighthouse if field/lab precision is needed.
- Defer or reduce non-critical animation and intro JavaScript where it affects first interaction.
- Consider consolidating CSS bundles over time if this page is optimized further.

## Images

### Findings

- Homepage sampled two WebP images: `scene.webp` and `car.webp`.
- Both have dimensions and are below the 200KB warning threshold.
- Both use empty alt text. That is acceptable if they are decorative, but the audit tool flags them as weak because they are visible hero assets.
- One sampled below-the-fold/non-primary image was not lazy-loaded.

### Recommendations

- If the scene and car are decorative, keep `alt=""` but mark the surrounding visual as decorative consistently.
- If they convey the portfolio theme, add short descriptive alt text to the visible hero image.
- Lazy-load any non-LCP decorative image that is not needed for first paint.

## AI Search Readiness

### Findings

- `llms.txt` is present and substantive.
- Major AI search crawlers are allowed by robots.txt, including GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, and PerplexityBot.
- Structured data is present.
- The homepage has no strong 134-167 word self-contained answer block.
- Visible author/date signals are weak.

### Recommendations

- Add a concise, answer-first "Joseph Doyle-Samadi is..." paragraph.
- Add visible "Last updated" or "Portfolio maintained by Joseph Doyle-Samadi" text where it fits naturally.
- Consider adding a short project summary block for each flagship project that states problem, build, stack, and outcome in one extractable passage.

## Visual And UX Signals

### Findings

- Desktop and mobile screenshots captured successfully.
- The first-visit lamp intro significantly darkens and overlays the above-the-fold content in screenshots.
- Mobile screenshot shows the intro overlay and "OFF / pull the lamp cord" prompt near the bottom while the main H1 is barely visible.
- Mobile analysis found no horizontal scroll and readable base font size.
- Two visible touch targets were flagged as undersized: brand link height and lamp pull control width.

### Recommendations

- Keep the intro if it is important to the experience, but consider reducing overlay opacity or auto-revealing content for crawlers/reduced-motion users.
- Increase tappable dimensions for the brand link and lamp pull target to at least 44px in both directions.
- Test first viewport screenshots after changes; the brand, H1, and primary CTA should be legible without interaction.

## Limitations

- No Google API credentials were configured, so the audit did not use GSC, GA4, CrUX, or PageSpeed field data.
- Moz and Bing backlink credentials were not configured.
- Performance score uses deterministic heuristics rather than live PageSpeed field data.
- A PDF file was generated, but environment verification marked premium report support degraded because a WeasyPrint system dependency is missing.
