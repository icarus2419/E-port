const { route } = require('../api/_poker');

function call(routeName, method = 'GET', url = '/', body = null) {
  return new Promise((resolve, reject) => {
    const req = { method, url, body: body || {} };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
      end(payload = '') { resolve({ statusCode: this.statusCode, headers: this.headers, body: String(payload) }); }
    };
    Promise.resolve(route(req, res, routeName)).catch(reject);
  });
}

(async () => {
  let out = await call('health', 'GET', '/api/health');
  if (out.statusCode !== 200) throw new Error('health failed: ' + out.body);
  out = await call('rooms/create', 'POST', '/api/rooms/create', { name: 'Smoke Table', variant: 'holdem', max_seats: 2 });
  const created = JSON.parse(out.body);
  if (!created.room_id) throw new Error('room create returned no room id');
  out = await call('join', 'POST', '/api/join', { room_id: created.room_id, seat_index: 0, name: 'Tester', ai_level: 'human', client_id: 'smoke' });
  const joined = JSON.parse(out.body);
  if (!joined.token) throw new Error('join returned no token');
  out = await call('add_ai', 'POST', '/api/add_ai', { room_id: created.room_id, seat_index: 1, ai_level: 'ai_easy' });
  if (out.statusCode !== 200) throw new Error('add_ai failed: ' + out.body);
  out = await call('start_hand', 'POST', '/api/start_hand', { room_id: created.room_id });
  if (out.statusCode !== 200) throw new Error('start_hand failed: ' + out.body);
  out = await call('state', 'GET', `/api/state?room_id=${created.room_id}&token=${joined.token}`);
  const state = JSON.parse(out.body);
  if (!state.viewer_token_valid || !state.hand_in_progress) throw new Error('state did not show active human hand');
  console.log('Poker API smoke test passed:', created.room_id, state.realtime_mode);
})().catch((err) => { console.error(err); process.exit(1); });
