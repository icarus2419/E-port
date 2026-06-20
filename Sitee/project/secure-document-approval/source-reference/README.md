# SecureDoc — Secure Document Approval

A connected secure document approval platform with a premium light SaaS interface, Express backend, role-based access, file uploads, reviewer decisions, SHA-256 evidence, and audit trails.

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:8787
```

## Demo accounts

All demo accounts use:

```text
demo123
```

- `employee@demo.com` — upload, draft, submit, track status
- `reviewer@demo.com` — review assigned pending documents
- `admin@demo.com` — see and control everything

## Design

A clean, light SaaS interface inspired by modern security/compliance products: white cards, soft blue and cyan accents, deep navy text, rounded corners, Inter typography, and crisp status badges. Role-based sign-in cards (Employee / Reviewer / Admin) replace a plain login form on the landing page.

## Notes

The frontend (`public/`) was redesigned for a polished, professional look while every backend route, demo account, and data flow stays the same as before.
## UI polish in this version

This build keeps the project simple and clean while improving the frontend presentation:

- Cleaner light SaaS landing page
- Better spacing and hierarchy
- No clipped sign-in card on normal desktop screens
- Simplified trust/security copy
- More polished dashboard preview and role cards
- Responsive layout kept simple on smaller screens

