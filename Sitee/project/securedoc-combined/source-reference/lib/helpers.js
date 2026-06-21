import { ROLE_NAMES, STATUS_LABELS } from './config.js';
import { now, id, auditHash } from './crypto-utils.js';
import { fileIntegrity } from './file-validator.js';
import { saveDb } from './db.js';

export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return { ...safe, roleName: ROLE_NAMES[user.role] || user.role };
}

export function attachNames(db, doc) {
  const owner = db.users.find((u) => u.id === doc.ownerId);
  const reviewer = db.users.find((u) => u.id === doc.assignedTo);
  const approvalReceipt = doc.approvalReceipt
    ? { ...doc.approvalReceipt, approver: publicUser(db.users.find((u) => u.id === doc.approvalReceipt.approvedById)) }
    : null;
  return {
    ...doc,
    statusLabel: STATUS_LABELS[doc.status] || doc.status,
    owner: publicUser(owner),
    reviewer: publicUser(reviewer),
    integrity: fileIntegrity(doc),
    approvalReceipt,
    comments: (doc.comments || []).map((c) => ({
      ...c,
      user: publicUser(db.users.find((u) => u.id === c.userId))
    }))
  };
}

export function canSeeDocument(user, doc) {
  if (user.role === 'admin') return true;
  if (doc.ownerId === user.id) return true;
  if (doc.assignedTo === user.id && doc.status !== 'draft') return true;
  return false;
}

export function canReviewDocument(user, doc) {
  if (doc.status !== 'pending') return false;
  if (user.role === 'admin') return true;
  return user.role === 'reviewer' && doc.assignedTo === user.id;
}

export function auditEvent(db, req, { documentId = null, action, details = '', status = 'success' }) {
  const actor = req.user || null;
  const previousHash = db.audit.at(-1)?.eventHash || 'GENESIS';
  const event = {
    id: id('aud'),
    documentId,
    actorId: actor?.id || null,
    actorRole: actor?.role || (req.actorRole || 'anonymous'),
    action,
    status,
    details,
    ip: req.ip || 'local',
    createdAt: now(),
    previousHash
  };
  event.eventHash = auditHash(event);
  db.audit.push(event);
  return event;
}

export function auditFailure(req, { documentId = null, details }) {
  auditEvent(req.db, req, { documentId, action: 'failed_permission', status: 'denied', details });
  saveDb(req.db);
}

export function deny(req, res, status, error, details, documentId = null) {
  if (req.db && req.user) auditFailure(req, { documentId, details });
  return res.status(status).json({ error });
}
