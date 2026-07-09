# SEO Action Plan

## Critical Path

| Priority | Area | Action |
|----------|------|--------|
| High | Trust/content | Add visible author/founder attribution with role, focus, contact paths, GitHub/LinkedIn, and last-updated signal. |
| High | Security | Add `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` headers in `vercel.json`. |
| High | Visual UX | Reduce first-visit intro obstruction or provide a crawler/reduced-motion path where the H1 and CTA remain legible. |
| Medium | Schema | Add `WebPage` schema and connect it to existing `Person` and `WebSite` entities. |
| Medium | Metadata | Shorten long page titles and meta descriptions, especially NoSite Leads and SecureDoc. |
| Medium | AI readiness | Add one 120-160 word answer-first homepage passage describing who Joseph is and what he builds. |
| Low | Sitemap | Use page-specific `lastmod` dates when pages change independently. |
| Low | IndexNow | Add IndexNow only if faster Bing discovery becomes useful. |

## Suggested Implementation Order

1. Update `vercel.json` with baseline security headers.
2. Add the visible author/trust block to the homepage.
3. Add `WebPage` JSON-LD to the homepage schema graph.
4. Trim metadata on the homepage and project pages.
5. Rework the intro overlay/touch targets and recapture screenshots.
6. Re-run performance with PageSpeed or Lighthouse if exact CWV numbers matter.

## Metadata Targets

| URL | Current Issue | Target |
|-----|---------------|--------|
| `/` | Meta description is 189 characters. | 150-160 characters. |
| `/project/poker-platform/` | Title is 63 characters. | 50-60 characters if possible. |
| `/project/nosite-leads/` | Title is 83 characters and description is 218 characters. | Shorten both around the main product/value phrase. |
| `/project/securedoc-combined/` | Description is 173 characters. | Trim to the strongest approval/audit-trail value prop. |

## Re-Audit Notes

- Re-run after deployment to confirm headers are live on Vercel.
- Use Google Search Console and PageSpeed API credentials for stronger indexation and Core Web Vitals evidence.
- Keep `.seo-cache/` ignored; durable report artifacts are in this audit folder.
