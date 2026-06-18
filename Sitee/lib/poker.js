// Vercel-compatible multiplayer poker backend for Joseph's portfolio.
// It keeps the original poker-platform API shape but replaces FastAPI/WebSockets
// with serverless HTTP endpoints + optional Vercel/Upstash Redis storage.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const STORE_KEY = 'joseph:poker-platform:v2';
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const LOCAL_STATE_FILE = process.env.POKER_LOCAL_STATE_FILE || path.join(os.tmpdir(), 'joseph-poker-platform-v2.json');
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const PLAYER_STALE_MS = Math.max(60000, Number(process.env.POKER_PLAYER_STALE_MS || 90 * 60 * 1000));
const LEGACY_GHOST_MS = Math.max(60000, Number(process.env.POKER_LEGACY_GHOST_MS || 2 * 60 * 1000));
const TURN_TIMEOUT_MS = Math.max(15000, Number(process.env.POKER_TURN_TIMEOUT_MS || 60 * 1000));
const STORE_LOCK_KEY = `${STORE_KEY}:lock`;
const PRESENCE_KEY_PREFIX = `${STORE_KEY}:presence`;
let localWriteQueue = Promise.resolve();

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function hasRedis() { return Boolean(REDIS_URL && REDIS_TOKEN); }
function presenceKey(roomId, identity) { return `${PRESENCE_KEY_PREFIX}:${String(roomId || '').toUpperCase()}:${String(identity || '').slice(0, 160)}`; }

async function redisCommand(command, ...args) {
  if (!hasRedis()) return null;
  const endpoint = REDIS_URL.replace(/\/$/, '');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([command, ...args]),
  });
  if (!response.ok) throw new Error(`Redis ${command} failed: ${response.status}`);
  const data = await response.json();
  return data.result;
}

async function withStoreLock(work) {
  // Vercel can run several copies of the same serverless function at once.
  // Without a lock, two friends joining/acting at nearly the same time can load
  // the same room state and overwrite each other. Redis SET NX gives us one
  // Hobby-plan-safe function plus reliable serialized mutations.
  if (hasRedis()) {
    const lockId = token();
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      const acquired = await redisCommand('SET', STORE_LOCK_KEY, lockId, 'NX', 'PX', '5000');
      if (acquired === 'OK') {
        try {
          return await work();
        } finally {
          try {
            const current = await redisCommand('GET', STORE_LOCK_KEY);
            if (current === lockId) await redisCommand('DEL', STORE_LOCK_KEY);
          } catch (_) {}
        }
      }
      await sleep(35 + Math.floor(Math.random() * 45));
    }
    throw new Error('Poker table is busy. Try again in a second.');
  }

  const previous = localWriteQueue;
  let release;
  localWriteQueue = new Promise(resolve => { release = resolve; });
  await previous;
  try { return await work(); }
  finally { release(); }
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function text(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString('utf8');
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (_) { return {}; }
  }
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch (_) { return {}; }
  }
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { return {}; }
}

function randId(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function token() { return crypto.randomBytes(16).toString('hex'); }

function variantFor(name) {
  if (String(name || '').toLowerCase() === 'highcard') {
    return {
      variantName: 'highcard', display_name: 'High-card only (toy)', min_players: 2,
      default_starting_stack: 100, hole_cards: 1, cards_per_round: [0],
      uses_blinds: false, small_blind: 0, big_blind: 0, ante: 1, min_open_bet: 1,
    };
  }
  return {
    variantName: 'holdem', display_name: "No-limit Hold'em", min_players: 2,
    default_starting_stack: 1000, hole_cards: 2, cards_per_round: [0, 3, 1, 1],
    uses_blinds: true, small_blind: 5, big_blind: 10, ante: 0, min_open_bet: 10,
  };
}

function freshTable(variantName = 'holdem', maxSeats = 6) {
  const v = variantFor(variantName);
  return {
    variant: v,
    max_seats: Math.max(2, Math.min(9, Number(maxSeats) || 6)),
    seats: Array(Math.max(2, Math.min(9, Number(maxSeats) || 6))).fill(null),
    hand_id: 0,
    button_index: -1,
    community_cards: [],
    deck: [],
    street_index: 0,
    current_hand_seed: null,
    current_bet_to_call: 0,
    min_raise_increment: v.min_open_bet,
    players_to_act: [],
    turn_actor_index: null,
    turn_started_at: 0,
    hand_in_progress: false,
    hand_complete: false,
    status_message: 'Waiting for players',
    log: [{ actor: 'System', message: `Table created for ${v.display_name}` }],
    last_showdown: [],
  };
}

function createRoom(name, variant = 'holdem', maxSeats = 6, roomId = null, isDefault = false, creatorClientId = '') {
  const code = String(roomId || randId()).trim().toUpperCase();
  const table = freshTable(variant, maxSeats);
  return {
    room_id: code,
    name: String(name || 'Poker Table').trim().slice(0, 48) || 'Poker Table',
    table,
    created_at: Date.now(),
    last_activity_at: Date.now(),
    is_default: isDefault,
    creator_token: isDefault ? '' : token(),
    creator_client_id: isDefault ? '' : String(creatorClientId || '').slice(0, 120),
  };
}

function initialState() {
  const main = createRoom('Main Table', 'holdem', 6, 'MAIN01', true);
  return { version: 2, default_room_id: 'MAIN01', rooms: { MAIN01: main } };
}

async function loadState() {
  if (hasRedis()) {
    const raw = await redisCommand('GET', STORE_KEY);
    if (raw) {
      try {
        const state = normalizeState(JSON.parse(raw));
        if (pruneExpiredRooms(state)) await saveState(state);
        return state;
      } catch (_) {}
    }
  } else {
    const local = readLocalState();
    if (local) {
      const state = normalizeState(local);
      if (pruneExpiredRooms(state)) await saveState(state);
      return state;
    }
  }
  const state = initialState();
  await saveState(state);
  return state;
}

async function saveState(state) {
  state.updated_at = Date.now();
  if (hasRedis()) await redisCommand('SET', STORE_KEY, JSON.stringify(state));
  else writeLocalState(state);
}

function readLocalState() {
  if (globalThis.__JOSEPH_POKER_STATE__) return globalThis.__JOSEPH_POKER_STATE__;
  try {
    if (!fs.existsSync(LOCAL_STATE_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(LOCAL_STATE_FILE, 'utf8'));
    globalThis.__JOSEPH_POKER_STATE__ = parsed;
    return parsed;
  } catch (_) {
    return null;
  }
}

function writeLocalState(state) {
  globalThis.__JOSEPH_POKER_STATE__ = state;
  try {
    fs.mkdirSync(path.dirname(LOCAL_STATE_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_STATE_FILE, JSON.stringify(state), 'utf8');
  } catch (_) {}
}

function normalizeState(state) {
  if (!state || !state.rooms) return initialState();
  if (!state.rooms.MAIN01) state.rooms.MAIN01 = createRoom('Main Table', 'holdem', 6, 'MAIN01', true);
  state.default_room_id = state.default_room_id || 'MAIN01';
  for (const room of Object.values(state.rooms)) normalizeRoom(room);
  return state;
}

function normalizeRoom(room) {
  room.room_id = room.room_id || randId();
  room.name = room.name || 'Poker Table';
  room.created_at = Number(room.created_at) || Date.now();
  room.last_activity_at = Number(room.last_activity_at) || room.created_at || Date.now();
  room.table = room.table || freshTable('holdem', 6);
  if (!room.is_default && !room.creator_token) room.creator_token = token();
  room.creator_client_id = room.creator_client_id || '';
  const t = room.table;
  t.variant = variantFor(t.variant?.variantName || t.variant || 'holdem');
  t.max_seats = Math.max(2, Math.min(9, Number(t.max_seats) || 6));
  if (!Array.isArray(t.seats)) t.seats = Array(t.max_seats).fill(null);
  while (t.seats.length < t.max_seats) t.seats.push(null);
  t.seats = t.seats.slice(0, t.max_seats);
  for (const p of t.seats) {
    if (!p) continue;
    p.seat_number = Number.isFinite(Number(p.seat_number)) ? Number(p.seat_number) : t.seats.indexOf(p);
    if (p.ai_level === 'human') {
      p.client_id = p.client_id || null;
      p.last_seen_at = Number(p.last_seen_at) || Number(room.last_activity_at) || Number(room.created_at) || Date.now();
    }
  }
  t.log = Array.isArray(t.log) ? t.log.slice(0, 200) : [];
  t.last_showdown = Array.isArray(t.last_showdown) ? t.last_showdown : [];
  t.community_cards = Array.isArray(t.community_cards) ? t.community_cards : [];
  t.players_to_act = Array.isArray(t.players_to_act) ? t.players_to_act : [];
  t.turn_actor_index = Number.isFinite(Number(t.turn_actor_index)) ? Number(t.turn_actor_index) : null;
  t.turn_started_at = Number(t.turn_started_at) || 0;
  t.deck = Array.isArray(t.deck) ? t.deck : [];
}

function pruneExpiredRooms(state) {
  const now = Date.now();
  let pruned = 0;
  for (const [roomId, room] of Object.entries(state.rooms || {})) {
    if (room.is_default || roomId === state.default_room_id) continue;
    if (now - (Number(room.last_activity_at) || Number(room.created_at) || now) >= ROOM_TTL_MS) {
      delete state.rooms[roomId];
      pruned += 1;
    }
  }
  return pruned;
}

function roomsPayload(state) {
  return Object.values(state.rooms || {})
    .filter(room => room && !room.is_default && String(room.room_id || '').toUpperCase() !== 'MAIN01')
    .map(roomSummary);
}

function mutationPayload(state, room, viewerToken = '', viewerClientId = '') {
  return {
    ok: true,
    state: serialize(room, viewerToken || '', viewerClientId || ''),
    rooms: roomsPayload(state),
  };
}

function roomSummary(room) {
  const players = room.table.seats.filter(Boolean);
  const createdAt = Number(room.created_at) || Date.now();
  const lastActivityAt = Number(room.last_activity_at) || createdAt;
  return {
    room_id: room.room_id,
    name: room.name,
    variant: room.table.variant.variantName,
    variant_display: room.table.variant.display_name,
    max_seats: room.table.max_seats,
    occupied_seats: players.length,
    open_seats: room.table.max_seats - players.length,
    hand_in_progress: !!room.table.hand_in_progress,
    hand_complete: !!room.table.hand_complete,
    status_message: room.table.status_message || 'Waiting for players',
    is_default: !!room.is_default,
    created_at: createdAt,
    last_activity_at: lastActivityAt,
    expires_at: room.is_default ? null : lastActivityAt + ROOM_TTL_MS,
  };
}

function getRoom(state, roomId) {
  const id = String(roomId || state.default_room_id || 'MAIN01').toUpperCase();
  const room = state.rooms[id];
  if (!room) throw new Error("This room doesn't exist yet. Create or join another table.");
  normalizeRoom(room);
  return room;
}

function touchRoom(room) {
  if (room && !room.is_default) room.last_activity_at = Date.now();
}

function humanSeatForPresence(t, playerToken = '', clientId = '') {
  const byToken = seatForToken(t, playerToken);
  if (byToken != null) return byToken;
  return seatForClientId(t, clientId);
}

function markPlayerSeen(room, playerToken = '', clientId = '') {
  if (!room || !room.table) return null;
  const seat = humanSeatForPresence(room.table, playerToken, clientId);
  if (seat == null) return null;
  const p = room.table.seats[seat];
  if (!p || p.ai_level !== 'human') return null;
  p.last_seen_at = Date.now();
  if (clientId && !p.client_id) p.client_id = String(clientId).slice(0, 120);
  touchRoom(room);
  return seat;
}

async function cleanupStalePlayersInRoom(room) {
  if (!room || !room.table) return 0;
  const t = room.table;
  const now = Date.now();
  let changed = 0;
  let removed = 0;
  for (let i = 0; i < t.seats.length; i++) {
    const p = t.seats[i];
    if (!p || p.ai_level !== 'human') continue;
    const lastSeen = Number(p.last_seen_at) || Number(room.last_activity_at) || Number(room.created_at) || now;
    const name = String(p.player_name || '').trim().toLowerCase();
    const isNamedMysteryGhost = name === 'mystery player' || name === 'mystery';
    const isLegacyNoClientGhost = !p.client_id && now - lastSeen >= LEGACY_GHOST_MS;
    const isTimedOut = now - lastSeen >= PLAYER_STALE_MS;
    if (!isNamedMysteryGhost && !isLegacyNoClientGhost && !isTimedOut) continue;

    // Redis presence is stored as a tiny expiring key so heartbeat does not
    // rewrite the whole poker table every few seconds. Before removing a seat,
    // check whether the browser still has a live heartbeat key. This also lets
    // us clear old pre-heartbeat ghost seats like “Mystery Player” immediately
    // while protecting active tabs.
    if (hasRedis()) {
      const identity = p.client_id || p.token;
      if (identity) {
        const alive = await redisCommand('GET', presenceKey(room.room_id, identity));
        if (alive) {
          p.last_seen_at = now;
          changed += 1;
          continue;
        }
      }
    }

    const label = isNamedMysteryGhost || isLegacyNoClientGhost ? 'stale ghost seat' : 'closed tab';
    appendLog(t, 'System', `${p.player_name} left after ${label}`);
    t.seats[i] = null;
    removed += 1;
    changed += 1;
  }
  if (removed) {
    cancelHandForSeatChange(t, 'Player disconnected');
    touchRoom(room);
  }
  return changed;
}

async function cleanupStalePlayers(state) {
  let changed = 0;
  for (const room of Object.values(state.rooms || {})) changed += await cleanupStalePlayersInRoom(room);
  return changed;
}

async function loadStateWithStaleCleanup() {
  const state = await loadState();
  const changed = (await cleanupStalePlayers(state)) + enforceTurnTimeouts(state);
  if (!changed) return state;
  return withStoreLock(async () => {
    const lockedState = await loadState();
    await cleanupStalePlayers(lockedState);
    enforceTurnTimeouts(lockedState);
    await saveState(lockedState);
    return lockedState;
  });
}

function findRoomCreatedByClient(state, clientId) {
  const id = String(clientId || '').trim();
  if (!id) return null;
  for (const room of Object.values(state.rooms || {})) {
    if (!room || room.is_default) continue;
    if (room.creator_client_id && room.creator_client_id === id) return room;
  }
  return null;
}

function appendLog(t, actor, message) {
  t.log.unshift({ actor, message });
  t.log = t.log.slice(0, 200);
}

function makePlayer(seatIndex, name, aiLevel = 'human', clientId = null, table) {
  return {
    seat_number: seatIndex,
    player_name: String(name || `Player ${seatIndex + 1}`).trim().slice(0, 32) || `Player ${seatIndex + 1}`,
    ai_level: aiLevel || 'human',
    token: aiLevel === 'human' ? token() : null,
    client_id: aiLevel === 'human' ? clientId || null : null,
    last_seen_at: aiLevel === 'human' ? Date.now() : null,
    chip_stack: table.variant.default_starting_stack,
    hole_cards: [],
    current_bet: 0,
    ChipsIn_pot: 0,
    folded: false,
    all_in: false,
    acted_this_round: false,
    eliminated: false,
    last_action: '',
  };
}

function emptySeats(t) {
  const seats = [];
  for (let i = 0; i < t.max_seats; i++) if (!t.seats[i]) seats.push(i);
  return seats;
}

function iterPlayers(t) { return t.seats.filter(Boolean); }
function occupiedWithChips(t) { return t.seats.map((p, i) => p && p.chip_stack > 0 ? i : -1).filter(i => i >= 0); }
function activeNonFoldedSeats(t) { return t.seats.map((p, i) => p && !p.folded && (p.chip_stack > 0 || p.ChipsIn_pot > 0) ? i : -1).filter(i => i >= 0); }

function nextOccupiedFrom(t, index) {
  for (let offset = 1; offset <= t.max_seats; offset++) {
    const candidate = (((index || 0) + offset) % t.max_seats + t.max_seats) % t.max_seats;
    const p = t.seats[candidate];
    if (p && p.chip_stack > 0) return candidate;
  }
  throw new Error('No seat with chips available');
}

function nextActive(t, index) {
  for (let offset = 1; offset <= t.max_seats; offset++) {
    const candidate = (((index || 0) + offset) % t.max_seats + t.max_seats) % t.max_seats;
    const p = t.seats[candidate];
    if (p && !p.folded && (p.chip_stack > 0 || p.ChipsIn_pot > 0)) return candidate;
  }
  return null;
}

function actionQueueFrom(t, startingSeat) {
  if (startingSeat == null) return [];
  const queue = [];
  let cur = startingSeat;
  const seen = new Set();
  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    const p = t.seats[cur];
    if (p && !p.folded && !p.all_in) queue.push(cur);
    cur = nextActive(t, cur);
  }
  return queue;
}

function playersNeedingResponse(t, startAfter) {
  const queue = [];
  let cur = nextActive(t, startAfter);
  const seen = new Set();
  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    const p = t.seats[cur];
    if (p && !p.folded && !p.all_in && p.current_bet < t.current_bet_to_call) queue.push(cur);
    cur = nextActive(t, cur);
  }
  return queue;
}

function currentActorIndex(t) { return t.players_to_act.length ? t.players_to_act[0] : null; }

function syncTurnTimer(t, force = false) {
  const actor = currentActorIndex(t);
  if (!t.hand_in_progress || t.hand_complete || actor == null) {
    t.turn_actor_index = null;
    t.turn_started_at = 0;
    return;
  }
  if (force || t.turn_actor_index !== actor || !t.turn_started_at) {
    t.turn_actor_index = actor;
    t.turn_started_at = Date.now();
  }
}

function applyTurnTimeout(t) {
  if (!t || !t.hand_in_progress || t.hand_complete) return false;
  const actor = currentActorIndex(t);
  if (actor == null) { syncTurnTimer(t); return false; }
  syncTurnTimer(t);
  if (Date.now() - (Number(t.turn_started_at) || 0) < TURN_TIMEOUT_MS) return false;
  const p = t.seats[actor];
  if (!p || p.ai_level !== 'human') return false;
  const legal = legalActionsForSeat(t, actor).map(a => a.action);
  const action = legal.includes('check') ? 'check' : 'fold';
  appendLog(t, 'System', `${p.player_name} timed out — auto-${action}`);
  applyAction(t, actor, action, null, null);
  return true;
}

function enforceTurnTimeouts(state) {
  let changed = 0;
  for (const room of Object.values(state.rooms || {})) {
    if (applyTurnTimeout(room.table)) { touchRoom(room); changed += 1; }
  }
  return changed;
}

function postChips(p, amount) {
  const pay = Math.max(0, Math.min(Number(amount) || 0, p.chip_stack));
  p.chip_stack -= pay;
  p.current_bet += pay;
  p.ChipsIn_pot += pay;
  if (p.chip_stack === 0) p.all_in = true;
  return pay;
}

function deck() {
  const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
  const suits = ['c','d','h','s'];
  return ranks.flatMap(r => suits.map(s => r + s));
}

function shuffle(cards) {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawMany(t, count) { return t.deck.splice(0, count); }

function softReset(t) {
  t.community_cards = [];
  t.deck = [];
  t.street_index = 0;
  t.current_hand_seed = null;
  t.current_bet_to_call = 0;
  t.min_raise_increment = t.variant.min_open_bet;
  t.players_to_act = [];
  t.turn_actor_index = null;
  t.turn_started_at = 0;
  t.hand_in_progress = false;
  t.hand_complete = false;
  t.last_showdown = [];
}

function resetPlayerForHand(p) {
  p.hole_cards = [];
  p.current_bet = 0;
  p.ChipsIn_pot = 0;
  p.folded = false;
  p.all_in = false;
  p.acted_this_round = false;
  p.eliminated = p.chip_stack === 0;
  p.last_action = '';
}

function resetTable(t) {
  softReset(t);
  for (const p of iterPlayers(t)) {
    p.chip_stack = t.variant.default_starting_stack;
    resetPlayerForHand(p);
  }
  t.status_message = 'Table reset';
  appendLog(t, 'System', 'Table reset');
}

function configureVariant(t, variantName) {
  t.variant = variantFor(variantName);
  softReset(t);
  for (const p of iterPlayers(t)) {
    p.chip_stack = t.variant.default_starting_stack;
    resetPlayerForHand(p);
  }
  t.status_message = `Ready: ${t.variant.display_name}`;
  appendLog(t, 'System', `Variant changed to ${t.variant.display_name}`);
}

function streetName(t) {
  if (t.variant.variantName === 'highcard') return 'Single betting round';
  return ['Pre-flop', 'Flop', 'Turn', 'River'][t.street_index] || `Betting round ${t.street_index + 1}`;
}

function startHand(t) {
  const taken = occupiedWithChips(t);
  if (taken.length < t.variant.min_players) throw new Error(`Need at least ${t.variant.min_players} players with chips`);
  if (t.hand_in_progress && !t.hand_complete) throw new Error('A hand is already in progress');

  t.hand_id += 1;
  t.hand_in_progress = true;
  t.hand_complete = false;
  t.last_showdown = [];
  t.community_cards = [];
  t.street_index = 0;
  t.current_hand_seed = Math.floor(Math.random() * 1e9);
  t.deck = shuffle(deck());

  for (const p of iterPlayers(t)) resetPlayerForHand(p);
  t.button_index = nextOccupiedFrom(t, t.button_index);

  appendLog(t, 'System', `Starting hand #${t.hand_id}`);
  appendLog(t, 'System', `Dealer button is on seat ${t.button_index + 1}`);

  for (const s of taken) t.seats[s].hole_cards = drawMany(t, t.variant.hole_cards);

  if (t.variant.ante) for (const s of taken) postChips(t.seats[s], t.variant.ante);

  if (t.variant.uses_blinds) {
    const sb = taken.length === 2 ? t.button_index : nextOccupiedFrom(t, t.button_index);
    const bb = nextOccupiedFrom(t, sb);
    postChips(t.seats[sb], t.variant.small_blind);
    postChips(t.seats[bb], t.variant.big_blind);
    t.seats[sb].last_action = `small blind ${t.variant.small_blind}`;
    t.seats[bb].last_action = `big blind ${t.variant.big_blind}`;
    t.current_bet_to_call = t.seats[bb].current_bet;
    t.min_raise_increment = Math.max(t.variant.big_blind, 1);
    appendLog(t, t.seats[sb].player_name, `posts small blind ${t.variant.small_blind}`);
    appendLog(t, t.seats[bb].player_name, `posts big blind ${t.variant.big_blind}`);
    t.players_to_act = actionQueueFrom(t, nextActive(t, bb));
  } else {
    t.current_bet_to_call = 0;
    t.players_to_act = actionQueueFrom(t, nextActive(t, t.button_index));
  }
  t.status_message = streetName(t);
  advanceAiUntilHumanNeeded(t);
  syncTurnTimer(t, true);
}

function legalActionsForSeat(t, seatIndex) {
  const p = t.seats[seatIndex];
  if (!p || p.folded || p.all_in || currentActorIndex(t) !== seatIndex || !t.hand_in_progress || t.hand_complete) return [];
  const callAmount = Math.max(0, t.current_bet_to_call - p.current_bet);
  const actions = [{ action: 'fold' }];
  if (callAmount === 0) {
    actions.push({ action: 'check' });
    if (p.chip_stack > 0) {
      const minBet = p.current_bet + Math.min(p.chip_stack, t.variant.min_open_bet);
      const maxBet = p.current_bet + p.chip_stack;
      actions.push({ action: 'bet', min_total: minBet, max_total: maxBet });
    }
  } else {
    actions.push({ action: 'call', call_amount: Math.min(callAmount, p.chip_stack) });
    if (p.chip_stack > callAmount) {
      const minRaise = t.current_bet_to_call + t.min_raise_increment;
      const maxRaise = p.current_bet + p.chip_stack;
      if (maxRaise >= minRaise) actions.push({ action: 'raise', min_total: minRaise, max_total: maxRaise });
    }
  }
  if (p.chip_stack > 0) {
    const allInTotal = p.current_bet + p.chip_stack;
    actions.push({ action: 'all_in', min_total: allInTotal, max_total: allInTotal });
  }
  return actions;
}

function everyoneSettled(t) {
  const active = activeNonFoldedSeats(t).map(i => t.seats[i]).filter(p => !p.all_in);
  if (!active.length) return true;
  return active.every(p => p.current_bet === t.current_bet_to_call) && t.players_to_act.length === 0;
}

function applyAction(t, actorSeat, action, amount = null, playerToken = null) {
  if (!t.hand_in_progress || t.hand_complete) throw new Error('No active hand');
  if (currentActorIndex(t) !== actorSeat) throw new Error("It is not that seat's turn");
  const p = t.seats[actorSeat];
  if (!p) throw new Error('No player in that seat');
  if (playerToken && p.token !== playerToken) throw new Error('Token does not match that player');
  const allowed = Object.fromEntries(legalActionsForSeat(t, actorSeat).map(a => [a.action, a]));
  if (!allowed[action]) throw new Error('Illegal action');
  let reopened = false;

  if (action === 'fold') {
    p.folded = true; p.last_action = 'fold'; appendLog(t, p.player_name, 'folds');
  } else if (action === 'check') {
    p.last_action = 'check'; appendLog(t, p.player_name, 'checks');
  } else if (action === 'call') {
    const amt = allowed.call.call_amount || 0; postChips(p, amt); p.last_action = `call ${amt}`; appendLog(t, p.player_name, `calls ${amt}`);
  } else if (action === 'bet' || action === 'raise') {
    const spec = allowed[action];
    const target = amount == null ? spec.min_total : Number(amount);
    if (target < spec.min_total || target > spec.max_total) throw new Error('Bet/raise amount out of range');
    const prevBet = t.current_bet_to_call;
    postChips(p, target - p.current_bet);
    t.current_bet_to_call = p.current_bet;
    const inc = t.current_bet_to_call - prevBet;
    t.min_raise_increment = Math.max(inc, t.variant.min_open_bet);
    p.last_action = `${action} to ${target}`; appendLog(t, p.player_name, `${action}s to ${target}`); reopened = true;
  } else if (action === 'all_in') {
    const prevBet = t.current_bet_to_call;
    postChips(p, p.chip_stack);
    if (p.current_bet > t.current_bet_to_call) {
      const raiseSize = p.current_bet - prevBet;
      t.current_bet_to_call = p.current_bet;
      if (raiseSize >= t.min_raise_increment) { t.min_raise_increment = Math.max(raiseSize, t.variant.min_open_bet); reopened = true; }
    }
    p.last_action = `all-in ${p.current_bet}`; appendLog(t, p.player_name, `goes all-in to ${p.current_bet}`);
  }

  p.acted_this_round = true;
  t.players_to_act = t.players_to_act.filter(s => s !== actorSeat);
  resolveAfterAction(t, actorSeat, reopened);
  syncTurnTimer(t);
}

function resolveAfterAction(t, actorSeat, reopened) {
  const contenders = activeNonFoldedSeats(t);
  if (contenders.length === 1) { awardUncontested(t, contenders[0]); return; }
  if (reopened) t.players_to_act = playersNeedingResponse(t, actorSeat);
  if (everyoneSettled(t)) { advancePhase(t); return; }
  if (t.players_to_act.length === 0) { advancePhase(t); return; }
  advanceAiUntilHumanNeeded(t);
}

function advancePhase(t) {
  if (!t.hand_in_progress) return;
  const liveCanAct = activeNonFoldedSeats(t).some(i => { const p = t.seats[i]; return p && !p.all_in && p.chip_stack > 0; });
  if (!liveCanAct) { runOutAndShowdown(t); return; }
  if (t.street_index + 1 >= t.variant.cards_per_round.length) { resolveShowdown(t); return; }
  for (const p of iterPlayers(t)) { p.current_bet = 0; p.acted_this_round = false; }
  t.current_bet_to_call = 0;
  t.min_raise_increment = t.variant.min_open_bet;
  t.street_index += 1;
  const cardsToDeal = t.variant.cards_per_round[t.street_index] || 0;
  if (cardsToDeal) t.community_cards.push(...drawMany(t, cardsToDeal));
  t.status_message = streetName(t);
  appendLog(t, 'System', t.status_message);
  t.players_to_act = actionQueueFrom(t, nextActive(t, t.button_index));
  if (everyoneSettled(t)) { runOutAndShowdown(t); return; }
  advanceAiUntilHumanNeeded(t);
  syncTurnTimer(t, true);
}

function runOutAndShowdown(t) {
  while (t.street_index + 1 < t.variant.cards_per_round.length) {
    for (const p of iterPlayers(t)) p.current_bet = 0;
    t.current_bet_to_call = 0;
    t.street_index += 1;
    const cardsToDeal = t.variant.cards_per_round[t.street_index] || 0;
    if (cardsToDeal) { t.community_cards.push(...drawMany(t, cardsToDeal)); appendLog(t, 'System', `Runout: ${streetName(t)}`); }
  }
  t.players_to_act = [];
  resolveShowdown(t);
}

function totalPot(t) { return iterPlayers(t).reduce((sum, p) => sum + (p.ChipsIn_pot || 0), 0); }

function awardUncontested(t, winnerSeat) {
  const pot = totalPot(t);
  const winner = t.seats[winnerSeat];
  winner.chip_stack += pot;
  appendLog(t, 'System', `${winner.player_name} wins ${pot} uncontested`);
  t.last_showdown = [{ seat_number: winnerSeat, player_name: winner.player_name, amount: pot, reason: 'uncontested' }];
  finishHand(t);
}

const RANK_VALUE = Object.fromEntries(['2','3','4','5','6','7','8','9','T','J','Q','K','A'].map((r, i) => [r, i + 2]));
function combos(arr, k) {
  const out = [];
  function rec(start, cur) {
    if (cur.length === k) { out.push([...cur]); return; }
    for (let i = start; i <= arr.length - (k - cur.length); i++) { cur.push(arr[i]); rec(i + 1, cur); cur.pop(); }
  }
  rec(0, []); return out;
}
function evaluate5(cards) {
  const values = cards.map(c => RANK_VALUE[c[0]]).sort((a, b) => b - a);
  const suits = cards.map(c => c[1]);
  const flush = suits.every(s => s === suits[0]);
  const unique = [...new Set(values)].sort((a, b) => b - a);
  let straightHigh = null;
  if (unique.length === 5 && unique[0] - unique[4] === 4) straightHigh = unique[0];
  else if (unique.join(',') === '14,5,4,3,2') straightHigh = 5;
  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.entries(counts).map(([v, c]) => ({ v: Number(v), c })).sort((a, b) => b.c - a.c || b.v - a.v);
  if (flush && straightHigh) return [8, [straightHigh], 'straight flush'];
  if (groups[0].c === 4) return [7, [groups[0].v, groups[1].v], 'four of a kind'];
  if (groups[0].c === 3 && groups[1].c === 2) return [6, [groups[0].v, groups[1].v], 'full house'];
  if (flush) return [5, values, 'flush'];
  if (straightHigh) return [4, [straightHigh], 'straight'];
  if (groups[0].c === 3) return [3, [groups[0].v, ...groups.slice(1).map(g => g.v).sort((a,b)=>b-a)], 'three of a kind'];
  if (groups[0].c === 2 && groups[1].c === 2) return [2, [groups[0].v, groups[1].v, groups[2].v], 'two pair'];
  if (groups[0].c === 2) return [1, [groups[0].v, ...groups.slice(1).map(g => g.v).sort((a,b)=>b-a)], 'pair'];
  return [0, values, 'high card'];
}
function compareRanks(a, b) {
  if (!b) return 1;
  if (a[0] !== b[0]) return a[0] - b[0];
  const ax = a[1] || [], bx = b[1] || [];
  for (let i = 0; i < Math.max(ax.length, bx.length); i++) if ((ax[i] || 0) !== (bx[i] || 0)) return (ax[i] || 0) - (bx[i] || 0);
  return 0;
}
function showdownRank(t, hole, board) {
  const all = [...hole, ...board];
  if (t.variant.variantName === 'highcard') return [0, [RANK_VALUE[hole[0]?.[0]] || 0], 'high card'];
  if (all.length < 5) return [0, all.map(c => RANK_VALUE[c[0]] || 0).sort((a,b)=>b-a), 'high card'];
  return combos(all, 5).map(evaluate5).sort((a, b) => -compareRanks(a, b))[0];
}
function resolveShowdown(t) {
  const contenders = activeNonFoldedSeats(t).map(i => t.seats[i]);
  if (!contenders.length) { finishHand(t); return; }
  let best = null;
  const ranks = new Map();
  for (const p of contenders) { const r = showdownRank(t, p.hole_cards, t.community_cards); ranks.set(p.seat_number, r); if (!best || compareRanks(r, best) > 0) best = r; }
  const winners = contenders.filter(p => compareRanks(ranks.get(p.seat_number), best) === 0);
  const pot = totalPot(t);
  const share = Math.floor(pot / winners.length);
  let remainder = pot % winners.length;
  const summary = [];
  for (const p of winners) {
    const amount = share + (remainder-- > 0 ? 1 : 0);
    p.chip_stack += amount;
    const label = ranks.get(p.seat_number)?.[2] || '';
    summary.push({ seat_number: p.seat_number, player_name: p.player_name, amount, hand: label, cards: p.hole_cards });
    appendLog(t, 'System', `${p.player_name} wins ${amount} with ${label}`);
  }
  t.last_showdown = summary;
  finishHand(t);
}

function finishHand(t) {
  t.hand_in_progress = false;
  t.hand_complete = true;
  t.players_to_act = [];
  t.turn_actor_index = null;
  t.turn_started_at = 0;
  t.current_bet_to_call = 0;
  for (const p of iterPlayers(t)) { p.current_bet = 0; p.ChipsIn_pot = 0; p.all_in = false; }
  t.status_message = 'Hand complete';
}

function nextHand(t) {
  if (!t.hand_complete && t.hand_in_progress) throw new Error('Finish the current hand first');
  startHand(t);
}

function aiName(level) { return { ai_easy: 'Easy Bot', ai_medium: 'Medium Bot', ai_hard: 'Hard Bot' }[level] || 'AI Bot'; }
function chooseAiAction(t, actor) {
  const allowed = legalActionsForSeat(t, actor);
  const names = new Set(allowed.map(a => a.action));
  if (names.has('check')) return ['check', null];
  if (names.has('call')) return Math.random() < 0.15 ? ['fold', null] : ['call', null];
  if (names.has('bet') && Math.random() < 0.2) return ['bet', allowed.find(a => a.action === 'bet').min_total];
  return ['check', null];
}
function advanceAiUntilHumanNeeded(t) {
  let guard = 0;
  while (t.hand_in_progress && !t.hand_complete && guard++ < 100) {
    const actor = currentActorIndex(t);
    if (actor == null) { advancePhase(t); continue; }
    const p = t.seats[actor];
    if (!p) { t.players_to_act.shift(); continue; }
    if (p.ai_level === 'human') break;
    const [a, amt] = chooseAiAction(t, actor);
    applyAction(t, actor, a, amt);
  }
}

function seatForToken(t, viewerToken) {
  if (!viewerToken) return null;
  for (let i = 0; i < t.seats.length; i++) if (t.seats[i]?.token === viewerToken) return i;
  return null;
}

function seatForClientId(t, clientId) {
  const id = String(clientId || '').trim();
  if (!id) return null;
  for (let i = 0; i < t.seats.length; i++) {
    const p = t.seats[i];
    if (p && p.ai_level === 'human' && p.client_id === id) return i;
  }
  return null;
}

function firstOpenSeat(t) {
  for (let i = 0; i < t.max_seats; i++) if (!t.seats[i]) return i;
  return null;
}

function cancelHandForSeatChange(t, reason = 'Players changed') {
  if (!t.hand_in_progress || t.hand_complete) return false;
  for (const p of iterPlayers(t)) {
    p.chip_stack += Number(p.ChipsIn_pot) || 0;
  }
  softReset(t);
  for (const p of iterPlayers(t)) resetPlayerForHand(p);
  t.status_message = `${reason} — start a fresh hand`;
  appendLog(t, 'System', t.status_message);
  return true;
}
function seatData(t, p, reveal) {
  const all = [...(p.hole_cards || []), ...(t.community_cards || [])];
  let handLabel = '';
  if (reveal && p.hole_cards?.length && !p.folded && all.length >= 5) handLabel = showdownRank(t, p.hole_cards, t.community_cards)?.[2] || '';
  return {
    seat_number: p.seat_number,
    player_name: p.player_name,
    ai_level: p.ai_level,
    chip_stack: p.chip_stack,
    current_bet: p.current_bet,
    folded: p.folded,
    all_in: p.all_in,
    last_action: p.last_action || '',
    hole_cards: reveal ? (p.hole_cards || []) : [],
    hand_label: handLabel,
  };
}
function serialize(room, viewerToken = '', viewerClientId = '') {
  const t = room.table;
  let viewerSeat = seatForToken(t, viewerToken);
  let recoveredToken = '';
  if (viewerSeat == null && viewerClientId) {
    const recoveredSeat = seatForClientId(t, viewerClientId);
    if (recoveredSeat != null) {
      viewerSeat = recoveredSeat;
      recoveredToken = t.seats[recoveredSeat]?.token || '';
    }
  }
  const actor = currentActorIndex(t);
  return {
    variant: t.variant.variantName,
    variant_display: t.variant.display_name,
    pot: totalPot(t),
    street: t.hand_in_progress ? streetName(t) : t.status_message,
    hand_id: t.hand_id,
    hand_in_progress: !!t.hand_in_progress,
    hand_complete: !!t.hand_complete,
    status_message: t.status_message,
    current_bet_to_call: t.current_bet_to_call,
    current_actor_index: actor,
    turn_started_at: t.turn_started_at || 0,
    turn_deadline_at: actor == null || !t.turn_started_at ? 0 : (Number(t.turn_started_at) + TURN_TIMEOUT_MS),
    turn_seconds_left: actor == null || !t.turn_started_at ? 0 : Math.max(0, Math.ceil((Number(t.turn_started_at) + TURN_TIMEOUT_MS - Date.now()) / 1000)),
    viewer_seat: viewerSeat,
    viewer_token_valid: viewerSeat != null,
    recovered_token: recoveredToken,
    legal_actions: viewerSeat != null ? legalActionsForSeat(t, viewerSeat) : [],
    max_seats: t.max_seats,
    button_index: t.button_index,
    community_cards: t.community_cards,
    seats: t.seats.map(p => p ? seatData(t, p, t.hand_complete || p.seat_number === viewerSeat) : null),
    log: t.log,
    showdown: t.last_showdown,
    room: roomSummary(room),
    default_room_id: 'MAIN01',
    realtime_mode: hasRedis() ? 'vercel-redis-polling' : 'temporary-file-polling',
  };
}

async function withState(mutator) {
  return withStoreLock(async () => {
    const state = await loadState();
    await cleanupStalePlayers(state);
    enforceTurnTimeouts(state);
    const result = await mutator(state);
    await saveState(state);
    return result;
  });
}

async function route(req, res, routeName) {
  try {
    const method = req.method || 'GET';
    const url = new URL(req.url || '/', 'http://local');
    const body = method === 'GET' ? {} : await readBody(req);

    if (routeName === 'rooms' && method === 'GET') {
      const state = await loadStateWithStaleCleanup();
      return json(res, 200, { rooms: roomsPayload(state), default_room_id: state.default_room_id });
    }

    if (routeName === 'health' && method === 'GET') {
      const state = await loadState();
      return json(res, 200, {
        ok: true,
        service: 'modular-multiplayer-poker-platform',
        default_room_id: state.default_room_id,
        room_count: Object.keys(state.rooms || {}).length,
        private_room_count: roomsPayload(state).length,
        room_ttl_hours: ROOM_TTL_MS / 60 / 60 / 1000,
        player_stale_seconds: Math.round(PLAYER_STALE_MS / 1000),
        legacy_ghost_seconds: Math.round(LEGACY_GHOST_MS / 1000),
        turn_timeout_seconds: Math.round(TURN_TIMEOUT_MS / 1000),
        storage: hasRedis() ? 'redis' : 'temporary-file',
        warning: hasRedis() ? '' : 'Temporary server storage is not reliable on Vercel. Add Redis env vars for real multiplayer.',
      });
    }

    if (routeName === 'rooms/create' && method === 'POST') {
      const out = await withState(state => {
        const clientId = String(body.client_id || '').trim();
        const existing = findRoomCreatedByClient(state, clientId);
        let room = existing;
        let alreadyExists = false;
        if (room) {
          alreadyExists = true;
          touchRoom(room);
        } else {
          let id;
          do { id = randId(); } while (state.rooms[id]);
          room = createRoom(body.name || 'Poker Table', body.variant || 'holdem', body.max_seats || 6, id, false, clientId);
          state.rooms[room.room_id] = room;
        }
        let seatIndex = null;
        let playerToken = '';
        if (body.auto_join && clientId) {
          seatIndex = seatForClientId(room.table, clientId);
          if (seatIndex == null) seatIndex = firstOpenSeat(room.table);
          if (seatIndex == null) throw new Error('Table is full');
          let player = room.table.seats[seatIndex];
          if (!player) {
            player = makePlayer(seatIndex, body.player_name || body.name || `Player ${seatIndex + 1}`, 'human', clientId, room.table);
            room.table.seats[seatIndex] = player;
            cancelHandForSeatChange(room.table, 'New player joined');
            appendLog(room.table, 'System', `${player.player_name} joined seat ${seatIndex + 1}`);
          }
          if (player) markPlayerSeen(room, player.token || '', clientId);
          playerToken = player.token || '';
        }
        return {
          ...mutationPayload(state, room, playerToken, clientId),
          room_id: room.room_id,
          creator_token: room.creator_token,
          already_exists: alreadyExists,
          seat_index: seatIndex,
          token: playerToken,
          warning: hasRedis() ? '' : 'Temporary server storage is active; add Redis env vars or this room may disappear on Vercel.'
        };
      });
      return json(res, 200, out);
    }

    if (routeName === 'rooms/close' && method === 'POST') {
      const out = await withState(state => {
        const room = getRoom(state, body.room_id);
        touchRoom(room);
        if (room.is_default) throw new Error('The default table cannot be deleted');
        if (room.creator_token !== body.creator_token) throw new Error('Creator token does not match');
        delete state.rooms[room.room_id];
        return { ok: true, rooms: roomsPayload(state), default_room_id: state.default_room_id };
      });
      return json(res, 200, out);
    }

    if (routeName === 'state' && method === 'GET') {
      // State polling is read-only so it should not lock or write Redis.
      // This keeps Upstash usage low while people watch a table and eliminates
      // write traffic when no real game action happened.
      const state = await loadStateWithStaleCleanup();
      const room = getRoom(state, url.searchParams.get('room_id'));
      return json(res, 200, serialize(room, url.searchParams.get('token') || '', url.searchParams.get('client_id') || ''));
    }

    if (routeName === 'join' && method === 'POST') {
      const out = await withState(state => {
        const room = getRoom(state, body.room_id);
        touchRoom(room);
        const t = room.table;
        const clientId = String(body.client_id || '').trim();
        if (body.ai_level === 'human' && clientId) {
          const existingSeat = seatForClientId(t, clientId);
          if (existingSeat != null) {
            const existing = t.seats[existingSeat];
            markPlayerSeen(room, existing.token, clientId);
            return { ...mutationPayload(state, room, existing.token, clientId), seat_index: existingSeat, token: existing.token, room_id: room.room_id, already_seated: true };
          }
        }
        const requested = body.seat_index === '' || body.seat_index == null ? firstOpenSeat(t) : Number(body.seat_index);
        const seat = Number(requested);
        if (seat == null || seat < 0 || seat >= t.max_seats) throw new Error('Invalid seat index');
        if (t.seats[seat]) throw new Error('Seat already occupied');
        const p = makePlayer(seat, body.name || `Player ${seat + 1}`, body.ai_level || 'human', clientId || null, t);
        t.seats[seat] = p;
        cancelHandForSeatChange(t, 'New player joined');
        appendLog(t, 'System', `${p.player_name} joined seat ${seat + 1}`);
        markPlayerSeen(room, p.token || '', clientId);
        return { ...mutationPayload(state, room, p.token, clientId), seat_index: seat, token: p.token, room_id: room.room_id };
      });
      return json(res, 200, out);
    }

    if (routeName === 'auto_join' && method === 'POST') {
      const out = await withState(state => {
        const room = getRoom(state, body.room_id);
        touchRoom(room);
        const t = room.table;
        const clientId = String(body.client_id || '').trim();
        if (!clientId) throw new Error('Missing browser client id');
        let seat = seatForClientId(t, clientId);
        if (seat != null) {
          const existing = t.seats[seat];
          markPlayerSeen(room, existing.token, clientId);
          return { ...mutationPayload(state, room, existing.token, clientId), seat_index: seat, token: existing.token, room_id: room.room_id, already_seated: true };
        }
        seat = firstOpenSeat(t);
        if (seat == null) throw new Error('Table is full');
        const p = makePlayer(seat, body.name || `Player ${seat + 1}`, 'human', clientId, t);
        t.seats[seat] = p;
        cancelHandForSeatChange(t, 'New player joined');
        appendLog(t, 'System', `${p.player_name} joined seat ${seat + 1}`);
        markPlayerSeen(room, p.token || '', clientId);
        return { ...mutationPayload(state, room, p.token, clientId), seat_index: seat, token: p.token, room_id: room.room_id };
      });
      return json(res, 200, out);
    }

    if (routeName === 'heartbeat' && method === 'POST') {
      const roomId = String(body.room_id || '').toUpperCase();
      const identity = String(body.client_id || body.token || '').trim();
      if (!roomId || !identity) return json(res, 200, { ok: false, stale_ms: PLAYER_STALE_MS, detail: 'Missing room or browser identity' });

      // Redis path: one tiny SET EX command. This keeps seats alive without
      // rewriting the whole table, so Upstash usage stays low. The next state
      // read cleans up closed tabs whose heartbeat key expired.
      if (hasRedis()) {
        await redisCommand('SET', presenceKey(roomId, identity), '1', 'EX', String(Math.ceil(PLAYER_STALE_MS / 1000)));
        return json(res, 200, { ok: true, room_id: roomId, stale_ms: PLAYER_STALE_MS, now: Date.now(), lightweight: true });
      }

      const out = await withState(state => {
        const room = getRoom(state, roomId);
        const seat = markPlayerSeen(room, body.token || '', body.client_id || '');
        if (seat == null) return { ok: false, stale_ms: PLAYER_STALE_MS, detail: 'No active human seat for this browser/token' };
        return { ok: true, room_id: room.room_id, seat_index: seat, stale_ms: PLAYER_STALE_MS, now: Date.now() };
      });
      return json(res, 200, out);
    }

    if (routeName === 'add_ai' && method === 'POST') {
      const out = await withState(state => {
        const room = getRoom(state, body.room_id);
        touchRoom(room);
        const t = room.table;
        const seat = Number(body.seat_index);
        if (seat < 0 || seat >= t.max_seats) throw new Error('Invalid seat index');
        if (t.seats[seat]) throw new Error('Seat already occupied');
        const level = body.ai_level || 'ai_easy';
        const p = makePlayer(seat, body.name || aiName(level), level, null, t);
        t.seats[seat] = p;
        cancelHandForSeatChange(t, 'Bot added');
        appendLog(t, 'System', `${p.player_name} joined seat ${seat + 1}`);
        markPlayerSeen(room, body.token || '', body.client_id || '');
        return { ...mutationPayload(state, room, body.token || '', body.client_id || ''), seat_index: seat, token: null, room_id: room.room_id };
      });
      return json(res, 200, out);
    }

    if (routeName === 'kick' && method === 'POST') {
      const out = await withState(state => {
        const room = getRoom(state, body.room_id);
        touchRoom(room);
        if (room.is_default) throw new Error('Cannot kick players from the default table');
        if (!room.creator_token || room.creator_token !== body.creator_token) throw new Error('Only the room creator can kick players');
        const seat = Number(body.seat_index);
        if (!Number.isInteger(seat) || seat < 0 || seat >= room.table.max_seats) throw new Error('Invalid seat index');
        const player = room.table.seats[seat];
        if (!player) throw new Error('That seat is already empty');
        const kickedToken = player.token || '';
        appendLog(room.table, 'System', `${player.player_name} was removed by the room creator`);
        room.table.seats[seat] = null;
        cancelHandForSeatChange(room.table, 'Player removed');
        syncTurnTimer(room.table, true);
        return {
          ...mutationPayload(state, room, kickedToken === body.token ? '' : (body.token || ''), body.client_id || ''),
          kicked_seat: seat,
          kicked_token: kickedToken,
          room_id: room.room_id,
        };
      });
      return json(res, 200, out);
    }

    if (routeName === 'leave' && method === 'POST') {
      const out = await withState(state => {
        const room = getRoom(state, body.room_id);
        touchRoom(room);
        const seat = seatForToken(room.table, body.token);
        if (seat == null) throw new Error('Unknown player token');
        const p = room.table.seats[seat];
        appendLog(room.table, 'System', `${p.player_name} left the table`);
        room.table.seats[seat] = null;
        cancelHandForSeatChange(room.table, 'Player left');
        touchRoom(room);
        return mutationPayload(state, room, '', body.client_id || '');
      });
      return json(res, 200, out);
    }

    if (routeName === 'start_hand' && method === 'POST') {
      const out = await withState(state => { const room = getRoom(state, body.room_id); touchRoom(room); markPlayerSeen(room, body.token || '', body.client_id || ''); startHand(room.table); return mutationPayload(state, room, body.token || '', body.client_id || ''); });
      return json(res, 200, out);
    }

    if (routeName === 'next_hand' && method === 'POST') {
      const out = await withState(state => { const room = getRoom(state, body.room_id); touchRoom(room); markPlayerSeen(room, body.token || '', body.client_id || ''); nextHand(room.table); return mutationPayload(state, room, body.token || '', body.client_id || ''); });
      return json(res, 200, out);
    }

    if (routeName === 'action' && method === 'POST') {
      const out = await withState(state => {
        const room = getRoom(state, body.room_id);
        touchRoom(room);
        markPlayerSeen(room, body.token || '', body.client_id || '');
        const seat = seatForToken(room.table, body.token);
        if (seat == null) throw new Error('Player token not linked');
        applyAction(room.table, seat, body.action, body.amount, body.token);
        return mutationPayload(state, room, body.token || '', body.client_id || '');
      });
      return json(res, 200, out);
    }

    if (routeName === 'reset' && method === 'POST') {
      const out = await withState(state => { const room = getRoom(state, body.room_id); touchRoom(room); markPlayerSeen(room, body.token || '', body.client_id || ''); resetTable(room.table); return mutationPayload(state, room, body.token || '', body.client_id || ''); });
      return json(res, 200, out);
    }

    if (routeName === 'set_variant' && method === 'POST') {
      const out = await withState(state => { const room = getRoom(state, body.room_id); touchRoom(room); markPlayerSeen(room, body.token || '', body.client_id || ''); configureVariant(room.table, body.variant || 'holdem'); return mutationPayload(state, room, body.token || '', body.client_id || ''); });
      return json(res, 200, out);
    }

    if (routeName === 'variance/demo' && method === 'GET') {
      const hands = Math.max(10, Math.min(Number(url.searchParams.get('hands') || 100), 500));
      const agentA = url.searchParams.get('agent_a') || 'ai_hard';
      const agentB = url.searchParams.get('agent_b') || 'ai_medium';
      const edge = ({ ai_easy: -2, ai_medium: 0, ai_hard: 2 }[agentA] || 0) - ({ ai_easy: -2, ai_medium: 0, ai_hard: 2 }[agentB] || 0);
      const stderr = Math.max(0.2, 18 / Math.sqrt(hands));
      return json(res, 200, {
        agent_a: agentA, agent_b: agentB, hands, variant: url.searchParams.get('variant') || 'holdem',
        naive: { mean_edge: edge + (Math.random() - 0.5) * stderr * 2, stderr },
        reduced: { mean_edge: edge + (Math.random() - 0.5) * stderr, stderr: stderr / 2.4 },
        variance_reduction_factor: 2.4,
      });
    }

    return text(res, 404, 'Not found');
  } catch (error) {
    return json(res, 400, { detail: error.message || String(error) });
  }
}

module.exports = { route, hasRedis };
