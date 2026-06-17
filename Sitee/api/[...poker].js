// Single Vercel Serverless Function for all poker API routes.
// Keeps the project under the Vercel Hobby limit by routing internally.
const { route } = require('../lib/poker');

function routeNameFromRequest(req) {
  const url = new URL(req.url || '/', 'http://local');
  return url.pathname
    .replace(/^\/api\/?/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.json$/i, '');
}

module.exports = (req, res) => {
  const routeName = routeNameFromRequest(req);
  return route(req, res, routeName);
};
