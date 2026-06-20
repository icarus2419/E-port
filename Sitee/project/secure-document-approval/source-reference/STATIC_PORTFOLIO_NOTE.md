# Static portfolio demo note

The original SecureDoc app includes an Express backend for authentication, uploads, file hashing, audit logging, and document decisions. For this portfolio ZIP, the live demo under `project/secure-document-approval/demo/` uses the original frontend with a browser-local API shim (`secure-static-demo.js`) so it can run on static hosting/Vercel without requiring a separate server.

The original backend source is preserved here for code review, but the demo intentionally stores mock changes in `localStorage` only.
