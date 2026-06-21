import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { UPLOAD_DIR, MAX_UPLOAD_SIZE, ALLOWED_ORIGINS, allowedMimeTypes, allowedExtensions } from './config.js';
import { safeOriginalName } from './crypto-utils.js';
import { loadDb } from './db.js';
import { sessions } from './auth-state.js';
import { deny } from './helpers.js';

export function securityHeaders(_req, res, next) {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ].join('; '));
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
}

export const corsOptions = {
  origin(origin, cb) {
    if (!origin || ALLOWED_ORIGINS.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = path.extname(safeOriginalName(file.originalname)).toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(safeOriginalName(file.originalname)).toLowerCase();
    if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)) return cb(null, true);
    const error = new Error('Unsupported file type. Upload PDF, Word, Excel, PNG, JPG, or TXT files only.');
    error.status = 400;
    cb(error);
  }
});

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const session = token ? sessions.get(token) : null;
  const db = loadDb();
  req.db = db;

  if (!token || !session) {
    return res.status(401).json({ error: 'Session is missing or invalid. Please log in again.' });
  }
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session user no longer exists. Please log in again.' });
  }

  session.lastSeenAt = Date.now();
  req.user = user;
  req.token = token;
  req.session = session;
  return next();
}

export function roleRequired(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return deny(req, res, 403,
        'Your role is not allowed to perform this action.',
        `Role ${req.user.role} attempted an action restricted to ${roles.join(', ')}.`
      );
    }
    return next();
  };
}
