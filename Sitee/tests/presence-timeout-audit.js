process.env.POKER_PLAYER_STALE_MS = '60000';
process.env.POKER_LOCAL_STATE_FILE = '/tmp/sitee-poker-presence-audit-' + Date.now() + '.json';
const apiHandler = require('../api/poker.js');

function call(method = 'GET', url = '/', body = null) {
  return new Promise((resolve, reject) => {
    const req = { method, url, body: body || {} };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
      end(payload = '') {
        const text = String(payload || '');
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch (_) {}
        resolve({ statusCode: this.statusCode, headers: this.headers, text, json });
      }
    };
    Promise.resolve(apiHandler(req, res)).catch(reject);
  });
}
async function must(method, url, body, label) {
  const res = await call(method, url, body);
  if (res.statusCode < 200 || res.statusCode >= 300 || res.json?.detail) {
    throw new Error(`${label} failed: ${res.statusCode} ${res.text}`);
  }
  return res.json;
}

(async () => {
  const room = await must('POST', '/api/rooms/create', { name: 'Presence Audit', variant: 'holdem', max_seats: 2 }, 'create room');
  const alice = await must('POST', '/api/join', { room_id: room.room_id, seat_index: 0, name: 'Alice', ai_level: 'human', client_id: 'alice-tab' }, 'Alice joins');
  const bob = await must('POST', '/api/join', { room_id: room.room_id, seat_index: 1, name: 'Bob', ai_level: 'human', client_id: 'bob-tab' }, 'Bob joins');
  await must('POST', '/api/heartbeat', { room_id: room.room_id, token: alice.token, client_id: 'alice-tab' }, 'Alice heartbeat');

  const state = globalThis.__JOSEPH_POKER_STATE__;
  state.rooms[room.room_id].table.seats[1].last_seen_at = Date.now() - 60000;

  const after = await must('GET', `/api/state?room_id=${room.room_id}&token=${alice.token}&client_id=alice-tab`, null, 'state cleanup');
  if (after.room.occupied_seats !== 1 || after.seats[1] !== null) {
    throw new Error('Closed/stale tab player was not released from the seat.');
  }
  if (!after.viewer_token_valid || after.viewer_seat !== 0) {
    throw new Error('Active heartbeat player was incorrectly removed.');
  }
  console.log(JSON.stringify({ ok: true, checked: 'closed tab stale player removed, active heartbeat player stays seated', roomId: room.room_id }, null, 2));
})().catch(err => { console.error(err.stack || err); process.exit(1); });
