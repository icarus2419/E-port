import { LOGIN_WINDOW_MS } from './config.js';

export const sessions = new Map();
export const loginAttempts = new Map();

export function loginKey(req, email) {
  return `${req.ip || 'local'}:${String(email || '').toLowerCase()}`;
}

export function loginAttemptState(req, email) {
  const key = loginKey(req, email);
  const current = loginAttempts.get(key);
  if (!current || Date.now() > current.resetAt) {
    const fresh = { count: 0, resetAt: Date.now() + LOGIN_WINDOW_MS };
    loginAttempts.set(key, fresh);
    return fresh;
  }
  return current;
}

export function clearLoginAttempts(req, email) {
  loginAttempts.delete(loginKey(req, email));
}

export function publicSession(session) {
  return {
    expiresAt: new Date(session.expiresAt).toISOString(),
    ttlMinutes: Math.round((session.expiresAt - Date.now()) / 60000)
  };
}
