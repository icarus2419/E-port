"""Vercel Python serverless entrypoint.

Vercel serves this file as an ASGI function at /api/poker.
vercel.json rewrites /api/<path> → /api/poker?route=<path> so all poker
routes arrive here; lib/poker/router.py dispatches on the `route` param.

Mangum wraps the FastAPI ASGI app for Lambda-style runtimes (some Vercel
Python builds). Vercel also accepts a bare `app` — exporting both covers both.
"""
import os, sys

# Vercel Lambda may set CWD to the project root or place __file__ inside
# /var/task/api/. Try both so lib/poker/ is importable in either layout.
for _root in (
    os.getcwd(),                                                    # /var/task  (Lambda CWD)
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),   # two levels up from api/poker.py
):
    if _root not in sys.path:
        sys.path.insert(0, _root)

from lib.poker.router import app  # noqa: F401 — Vercel ASGI path

try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")  # Lambda/Vercel handler path
except ImportError:
    pass  # Mangum not available; Vercel will use `app` directly
