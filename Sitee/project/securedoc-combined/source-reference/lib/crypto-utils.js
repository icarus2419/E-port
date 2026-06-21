import crypto from 'node:crypto';
import path from 'node:path';
import { UPLOAD_DIR } from './config.js';

export function now() {
  return new Date().toISOString();
}

export function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    if (!stored || !stored.includes(':')) return false;
    const [salt, originalHash] = stored.split(':');
    const testHash = crypto.scryptSync(password, salt, 64);
    const original = Buffer.from(originalHash, 'hex');
    return original.length === testHash.length && crypto.timingSafeEqual(original, testHash);
  } catch {
    return false;
  }
}

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function safeOriginalName(name) {
  const basename = path.basename(String(name || 'document').replaceAll('\\', '/'));
  return basename.replace(/[^\w .()[\]-]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 180) || 'document';
}

export function safeUploadPath(storageName) {
  const safeName = path.basename(String(storageName || ''));
  if (!safeName || safeName !== storageName) return null;
  const filePath = path.resolve(UPLOAD_DIR, safeName);
  if (!filePath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) return null;
  return filePath;
}

export function auditHash(event) {
  const canonical = {
    id: event.id,
    documentId: event.documentId || null,
    actorId: event.actorId || null,
    actorRole: event.actorRole || 'system',
    action: event.action,
    status: event.status || 'success',
    details: event.details || '',
    ip: event.ip || 'local',
    createdAt: event.createdAt,
    previousHash: event.previousHash || 'GENESIS'
  };
  return sha256(Buffer.from(JSON.stringify(canonical)));
}
