# Project integration summary

Added two featured portfolio projects:

1. `project/launchvault-client-content/`
   - Case study: `project/launchvault-client-content/index.html`
   - Static demo: `project/launchvault-client-content/demo/`
   - Built from the provided Vite/React `dist/` output. Asset paths were rewritten to work from the portfolio subfolder.

2. `project/secure-document-approval/`
   - Case study: `project/secure-document-approval/index.html`
   - Static demo: `project/secure-document-approval/demo/`
   - Original backend reference files: `project/secure-document-approval/source-reference/`
   - The demo uses `secure-static-demo.js` to mock the original API locally so the app runs on static hosting without an Express server.

Shared project transitions live in:
- `assets/project-transitions.css`
- `assets/project-transitions.js`

Existing poker transition files were left in place and continue to drive the poker Play/Back flow.
