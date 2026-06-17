process.env.POKER_LOCAL_STATE_FILE = '/tmp/sitee-poker-deep-audit-' + Date.now() + '.json';
const fs = require('fs');
try { fs.unlinkSync(process.env.POKER_LOCAL_STATE_FILE); } catch (_) {}
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
function ok(cond, msg, extra) {
  if (!cond) {
    const err = new Error(msg + (extra ? '\n' + JSON.stringify(extra, null, 2) : ''));
    throw err;
  }
}
async function must(method, url, body, label) {
  const res = await call(method, url, body);
  ok(res.statusCode >= 200 && res.statusCode < 300, `${label} failed HTTP ${res.statusCode}`, res.json || res.text);
  if (res.json && res.json.detail) throw new Error(`${label} returned detail: ${res.json.detail}`);
  return res.json;
}
function roomIn(list, id) { return list.rooms.find(r => r.room_id === id); }

(async () => {
  let h = await must('GET', '/api/health', null, 'direct health');
  ok(h.ok, 'health not ok', h);
  h = await must('GET', '/api/poker?route=health', null, 'rewritten health');
  ok(h.ok, 'rewrite health not ok', h);

  const created = await must('POST', '/api/poker?route=rooms/create', { name: 'Two Player Deep Audit', variant: 'holdem', max_seats: 2 }, 'rewritten create room');
  ok(created.room_id && created.creator_token, 'create did not return room and creator tokens', created);
  const roomId = created.room_id;

  let rooms = await must('GET', '/api/rooms', null, 'list rooms after create');
  let summary = roomIn(rooms, roomId);
  ok(summary && summary.occupied_seats === 0, 'created room missing or wrong occupied count', { roomId, rooms });

  const alice = await must('POST', '/api/join', { room_id: roomId, seat_index: 0, name: 'Alice', ai_level: 'human', client_id: 'alice-client' }, 'Alice joins');
  const bob = await must('POST', '/api/join', { room_id: roomId, seat_index: 1, name: 'Bob', ai_level: 'human', client_id: 'bob-client' }, 'Bob joins');
  ok(alice.token && bob.token && alice.token !== bob.token, 'players got invalid or duplicate tokens', { alice, bob });

  // Same client cannot take two seats in same room.
  const duplicate = await call('POST', '/api/join', { room_id: roomId, seat_index: 0, name: 'Alice2', ai_level: 'human', client_id: 'alice-client' });
  ok(duplicate.statusCode === 400, 'duplicate/same occupied seat should fail', duplicate.json || duplicate.text);

  let stateA = await must('GET', `/api/state?room_id=${roomId}&token=${alice.token}`, null, 'state for Alice');
  let stateB = await must('GET', `/api/state?room_id=${roomId}&token=${bob.token}`, null, 'state for Bob');
  ok(stateA.viewer_token_valid && stateA.viewer_seat === 0, 'Alice token invalid', stateA);
  ok(stateB.viewer_token_valid && stateB.viewer_seat === 1, 'Bob token invalid', stateB);
  ok(stateA.room.occupied_seats === 2 && stateB.room.occupied_seats === 2, 'both players not seated', { stateA: stateA.room, stateB: stateB.room });

  await must('POST', '/api/start_hand', { room_id: roomId }, 'start hand with 2 humans');
  stateA = await must('GET', `/api/state?room_id=${roomId}&token=${alice.token}`, null, 'Alice state after start');
  stateB = await must('GET', `/api/state?room_id=${roomId}&token=${bob.token}`, null, 'Bob state after start');
  ok(stateA.hand_in_progress && stateB.hand_in_progress, 'hand not in progress for both', { a: stateA.status_message, b: stateB.status_message });
  ok(stateA.seats[0].hole_cards.length === 2 && stateA.seats[1].hole_cards.length === 0, 'Alice visibility wrong: should see only her cards before showdown', stateA.seats);
  ok(stateB.seats[1].hole_cards.length === 2 && stateB.seats[0].hole_cards.length === 0, 'Bob visibility wrong: should see only his cards before showdown', stateB.seats);

  // Play a hand with conservative legal actions: call/check whenever possible, all-in only if no other progress option.
  const tokenBySeat = [alice.token, bob.token];
  for (let i = 0; i < 80; i++) {
    const viewer = await must('GET', `/api/state?room_id=${roomId}&token=${alice.token}`, null, 'loop state');
    if (!viewer.hand_in_progress || viewer.hand_complete) break;
    const actor = viewer.current_actor_index;
    ok(actor === 0 || actor === 1, 'unexpected actor', viewer);
    const tok = tokenBySeat[actor];
    const actorState = await must('GET', `/api/state?room_id=${roomId}&token=${tok}`, null, 'actor state');
    const legal = actorState.legal_actions.map(a => a.action);
    let action = legal.includes('check') ? 'check' : legal.includes('call') ? 'call' : legal.includes('fold') ? 'fold' : legal[0];
    await must('POST', '/api/action', { room_id: roomId, token: tok, action }, `action ${action} by seat ${actor}`);
  }
  stateA = await must('GET', `/api/state?room_id=${roomId}&token=${alice.token}`, null, 'Alice final hand state');
  ok(stateA.hand_complete || !stateA.hand_in_progress, 'hand did not complete within guard', stateA);

  // Simulate tab switches by making no leave call and only refreshing later.
  for (let i = 0; i < 3; i++) {
    stateB = await must('GET', `/api/state?room_id=${roomId}&token=${bob.token}`, null, `Bob refresh after simulated tab switch ${i}`);
    ok(stateB.viewer_token_valid && stateB.viewer_seat === 1, 'Bob was removed without pressing leave', stateB);
  }
  rooms = await must('GET', '/api/rooms', null, 'rooms after tab switch simulation');
  summary = roomIn(rooms, roomId);
  ok(summary && summary.occupied_seats === 2, 'room/player disappeared after tab switch simulation', { roomId, rooms });

  await must('POST', '/api/leave', { room_id: roomId, token: alice.token }, 'Alice leave seat');
  rooms = await must('GET', '/api/rooms', null, 'rooms after Alice leave');
  summary = roomIn(rooms, roomId);
  ok(summary && summary.occupied_seats === 1, 'room should persist after one player leaves', { roomId, rooms });

  await must('POST', '/api/leave', { room_id: roomId, token: bob.token }, 'Bob leave seat');
  rooms = await must('GET', '/api/rooms', null, 'rooms after Bob leave');
  summary = roomIn(rooms, roomId);
  ok(summary && summary.occupied_seats === 0, 'empty room should still persist for TTL, not instant delete', { roomId, rooms });

  const badClose = await call('POST', '/api/rooms/close', { room_id: roomId, creator_token: 'wrong' });
  ok(badClose.statusCode === 400, 'wrong creator token should not close room', badClose.json || badClose.text);
  await must('POST', '/api/rooms/close', { room_id: roomId, creator_token: created.creator_token }, 'creator close room');
  rooms = await must('GET', '/api/rooms', null, 'rooms after creator close');
  summary = roomIn(rooms, roomId);
  ok(!summary, 'room should only be deleted after creator close', { roomId, rooms });

  console.log(JSON.stringify({
    ok: true,
    checked: [
      'direct api health', 'vercel rewrite route health', 'create private room', 'two human players join same table',
      'duplicate seat rejected', 'private hole card visibility', 'start and complete two-human hand',
      'simulated tab switch does not leave/delete', 'leave seat does not delete room', 'creator-token room close only'
    ],
    storageDuringAudit: h.storage || 'unknown',
    roomId,
  }, null, 2));
})().catch(err => { console.error(err.stack || err); process.exit(1); });
