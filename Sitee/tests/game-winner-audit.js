process.env.POKER_LOCAL_STATE_FILE = '/tmp/sitee-poker-game-winner-audit-' + Date.now() + '.json';
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

async function must(method, url, body, label) {
  const res = await call(method, url, body);
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`${label} failed HTTP ${res.statusCode}: ${res.text}`);
  }
  return res.json;
}

(async () => {
  const created = await must('POST', '/api/rooms/create', { name: 'Game Winner Audit', variant: 'holdem', max_seats: 2 }, 'create');
  const roomId = created.room_id;
  const alice = await must('POST', '/api/join', { room_id: roomId, seat_index: 0, name: 'Alice', ai_level: 'human', client_id: 'alice' }, 'Alice joins');
  const bob = await must('POST', '/api/join', { room_id: roomId, seat_index: 1, name: 'Bob', ai_level: 'human', client_id: 'bob' }, 'Bob joins');
  const tokens = [alice.token, bob.token];

  let state = null;
  for (let hand = 0; hand < 12; hand++) {
    if (hand === 0) await must('POST', '/api/start_hand', { room_id: roomId, token: alice.token }, 'start hand');
    else await must('POST', '/api/next_hand', { room_id: roomId, token: alice.token }, 'next hand');

    for (let step = 0; step < 20; step++) {
      state = await must('GET', `/api/state?room_id=${roomId}&token=${alice.token}`, null, 'state');
      if (!state.hand_in_progress || state.hand_complete) break;
      const actor = state.current_actor_index;
      const actorState = await must('GET', `/api/state?room_id=${roomId}&token=${tokens[actor]}`, null, 'actor state');
      const legal = (actorState.legal_actions || []).map(a => a.action);
      const action = legal.includes('all_in') ? 'all_in'
        : legal.includes('call') ? 'call'
        : legal.includes('check') ? 'check'
        : 'fold';
      await must('POST', '/api/action', { room_id: roomId, token: tokens[actor], action }, `action ${action}`);
    }

    state = await must('GET', `/api/state?room_id=${roomId}&token=${alice.token}`, null, 'post-hand state');
    if (state.game_winner) break;
  }

  if (!state?.game_winner) throw new Error('Expected an overall game winner after repeated all-ins');
  const blocked = await call('POST', '/api/start_hand', { room_id: roomId, token: alice.token });
  if (blocked.statusCode < 400 || !/game is over/i.test(blocked.text)) {
    throw new Error('Expected start_hand to be blocked after game over: ' + blocked.text);
  }

  const reset = await must('POST', '/api/reset', { room_id: roomId, token: alice.token }, 'reset after game over');
  if (reset.state.game_winner) throw new Error('Reset should clear game_winner');
  const stacks = reset.state.seats.filter(Boolean).map(p => p.chip_stack);
  if (!stacks.every(v => v === 1000)) throw new Error('Reset should restore starting stacks: ' + JSON.stringify(stacks));

  console.log(JSON.stringify({ ok: true, checked: 'overall game winner and reset flow', roomId, winner: state.game_winner.player_name }, null, 2));
})().catch((err) => { console.error(err); process.exit(1); });
