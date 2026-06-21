import { Router } from 'express';
import crypto from 'node:crypto';
import { ROLE_NAMES, SESSION_TTL_MS, LOGIN_MAX_ATTEMPTS } from '../lib/config.js';
import { verifyPassword } from '../lib/crypto-utils.js';
import { loadDb, saveDb } from '../lib/db.js';
import { sessions, loginAttemptState, clearLoginAttempts, publicSession } from '../lib/auth-state.js';
import { publicUser, auditEvent } from '../lib/helpers.js';
import { authRequired } from '../lib/middleware.js';

const router = Router();

router.post('/auth/login', (req, res) => {
  const db = loadDb();
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const attempts = loginAttemptState(req, normalizedEmail);

  if (attempts.count >= LOGIN_MAX_ATTEMPTS) {
    auditEvent(db, { ip: req.ip, actorRole: 'anonymous' }, {
      action: 'failed_login', status: 'blocked',
      details: `Rate-limited login attempt for ${normalizedEmail || 'blank email'}.`
    });
    saveDb(db);
    return res.status(429).json({ error: 'Too many login attempts. Wait a few minutes and try again.' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
    attempts.count += 1;
    auditEvent(db, { ip: req.ip, actorRole: 'anonymous' }, {
      action: 'failed_login', status: 'failed',
      details: `Failed login attempt for ${normalizedEmail || 'blank email'}.`
    });
    saveDb(db);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const session = { userId: user.id, createdAt: Date.now(), lastSeenAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS };
  sessions.set(token, session);
  clearLoginAttempts(req, normalizedEmail);
  auditEvent(db, { user, ip: req.ip }, {
    action: 'login',
    details: `${user.name} logged in as ${ROLE_NAMES[user.role]}. Demo-only credentials were used.`
  });
  saveDb(db);
  res.json({ token, user: publicUser(user), session: publicSession(session), demoOnly: true });
});

router.post('/auth/logout', authRequired, (req, res) => {
  sessions.delete(req.token);
  auditEvent(req.db, req, { action: 'logout', details: `${req.user.name} logged out.` });
  saveDb(req.db);
  res.json({ ok: true });
});

router.get('/auth/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user), session: publicSession(req.session), demoOnly: true });
});

router.get('/users/reviewers', authRequired, (req, res) => {
  const reviewers = req.db.users.filter((u) => u.role === 'reviewer' || u.role === 'admin').map(publicUser);
  res.json({ reviewers });
});

export default router;
