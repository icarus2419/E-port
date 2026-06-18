// Single Vercel Serverless Function for every poker API route.
// Vercel Hobby counts physical files in /api, so all poker endpoints are
// routed through this one file using vercel.json rewrites.
const { route } = require('../lib/poker');

function routeNameFromRequest(req) {
  const url = new URL(req.url || '/', 'http://local');

  // Preferred path on Vercel: /api/health -> rewrite -> /api/poker?route=health
  const rewrittenRoute = url.searchParams.get('route');
  if (rewrittenRoute) return rewrittenRoute.replace(/^\/+|\/+$/g, '').replace(/\.json$/i, '');

  // Local/direct fallback: /api/rooms/create, /api/state, etc.
  return url.pathname
    .replace(/^\/api\/?/, '')
    .replace(/^poker\/?/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.json$/i, '');
}

module.exports = (req, res) => {
  const routeName = routeNameFromRequest(req);
  return route(req, res, routeName);
};
