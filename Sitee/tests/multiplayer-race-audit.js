process.env.POKER_LOCAL_STATE_FILE = '/tmp/sitee-poker-race-audit-' + Date.now() + '.json';
const fs = require('fs');
try { fs.unlinkSync(process.env.POKER_LOCAL_STATE_FILE); } catch (_) {}
const apiHandler = require('../api/poker.js');
function call(method = 'GET', url = '/', body = null) {
  return new Promise((resolve, reject) => {
    const req = { method, url, body: body || {} };
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(payload = '') { let json = null; try { json = payload ? JSON.parse(String(payload)) : null; } catch (_) {} resolve({ statusCode: this.statusCode, json, text: String(payload || '') }); } };
    Promise.resolve(apiHandler(req, res)).catch(reject);
  });
}
async function must(method, url, body, label) {
  const r = await call(method, url, body);
  if (r.statusCode < 200 || r.statusCode >= 300 || r.json?.detail) throw new Error(label + ' failed: ' + (r.text || JSON.stringify(r.json)));
  return r.json;
}
(async () => {
  const created = await must('POST', '/api/rooms/create', { name: 'Race Table', variant: 'holdem', max_seats: 6 }, 'create');
  const roomId = created.room_id;
  const oneRoomA = await must('POST', '/api/rooms/create', { name: 'One Room A', variant: 'holdem', max_seats: 2, client_id: 'one-room-client' }, 'one-room create A');
  const oneRoomB = await must('POST', '/api/rooms/create', { name: 'One Room B', variant: 'holdem', max_seats: 2, client_id: 'one-room-client' }, 'one-room create B');
  if (!oneRoomB.already_exists || oneRoomA.room_id !== oneRoomB.room_id) throw new Error('same client should only create one room at a time: ' + JSON.stringify({ oneRoomA, oneRoomB }));
  const joins = await Promise.all([0, 1, 2, 3, 4, 5].map(i => call('POST', '/api/join', { room_id: roomId, seat_index: i, name: 'P' + i, ai_level: 'human', client_id: 'client-' + i })));
  const failures = joins.filter(j => j.statusCode >= 400 || j.json?.detail);
  if (failures.length) throw new Error('concurrent joins failed: ' + JSON.stringify(failures));
  const rooms = await must('GET', '/api/rooms', null, 'rooms');
  const room = rooms.rooms.find(r => r.room_id === roomId);
  if (!room || room.occupied_seats !== 6) throw new Error('concurrent joins were overwritten: ' + JSON.stringify(room || rooms));
  const tokens = joins.map(j => j.json.token);
  const unique = new Set(tokens);
  if (unique.size !== 6) throw new Error('join tokens were not unique');
  console.log(JSON.stringify({ ok: true, checked: 'one-room-per-client and six concurrent joins remain seated', roomId }, null, 2));
})().catch(err => { console.error(err.stack || err); process.exit(1); });
