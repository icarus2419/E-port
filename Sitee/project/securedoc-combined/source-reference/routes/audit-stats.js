import { Router } from 'express';
import { canSeeDocument, publicUser } from '../lib/helpers.js';
import { fileIntegrity } from '../lib/file-validator.js';
import { authRequired } from '../lib/middleware.js';

const router = Router();

router.get('/audit', authRequired, (req, res) => {
  const visibleIds = new Set(req.db.documents.filter((doc) => canSeeDocument(req.user, doc)).map((doc) => doc.id));
  const { action = '', user = '', document = '', status = '' } = req.query || {};

  const events = req.db.audit
    .filter((event) => {
      const visible = event.documentId
        ? (req.user.role === 'admin' || visibleIds.has(event.documentId))
        : (req.user.role === 'admin' || event.actorId === req.user.id);
      if (!visible) return false;
      if (action && event.action !== action) return false;
      if (user && event.actorId !== user) return false;
      if (document && event.documentId !== document) return false;
      if (status && event.status !== status) return false;
      return true;
    })
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((event) => ({
      ...event,
      actor: publicUser(req.db.users.find((u) => u.id === event.actorId)),
      document: req.db.documents.find((doc) => doc.id === event.documentId) || null
    }));

  res.json({ audit: events });
});

router.get('/stats', authRequired, (req, res) => {
  const docs = req.db.documents.filter((doc) => canSeeDocument(req.user, doc));
  const byStatus = docs.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {});
  const pendingForMe = docs.filter((doc) => doc.status === 'pending' && (req.user.role === 'admin' || doc.assignedTo === req.user.id)).length;
  const mySubmissions = docs.filter((doc) => doc.ownerId === req.user.id).length;
  const verifiedFiles = docs.filter((doc) => fileIntegrity(doc).verified).length;
  const totalFileSize = docs.reduce((sum, doc) => sum + Number(doc.fileSize || 0), 0);

  res.json({ total: docs.length, pendingForMe, mySubmissions, approved: byStatus.approved || 0, changesRequested: byStatus.changes_requested || 0, verifiedFiles, totalFileSize, byStatus });
});

export default router;
