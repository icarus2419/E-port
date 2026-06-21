import { Router } from 'express';
import { saveDb } from '../lib/db.js';
import { now, id, sha256 } from '../lib/crypto-utils.js';
import { validateUploadedFile, deleteUploadedFile } from '../lib/file-validator.js';
import { attachNames, canSeeDocument, canReviewDocument, auditEvent, deny } from '../lib/helpers.js';
import { authRequired, roleRequired, upload } from '../lib/middleware.js';
import { safeUploadPath } from '../lib/crypto-utils.js';
import fs from 'node:fs';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const docs = req.db.documents
    .filter((doc) => canSeeDocument(req.user, doc))
    .map((doc) => attachNames(req.db, doc))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ documents: docs });
});

router.post('/', authRequired, roleRequired('submitter', 'admin'), upload.single('file'), (req, res) => {
  const db = req.db;
  const file = req.file;
  let uploadInfo;

  try {
    uploadInfo = validateUploadedFile(file);
  } catch (error) {
    deleteUploadedFile(file);
    return res.status(error.status || 400).json({ error: error.message });
  }

  const assignedTo = req.body.assignedTo || db.users.find((u) => u.role === 'reviewer')?.id;
  const reviewerExists = db.users.some((u) => u.id === assignedTo && ['reviewer', 'admin'].includes(u.role));
  if (!reviewerExists) {
    deleteUploadedFile(file);
    return res.status(400).json({ error: 'Choose a valid reviewer.' });
  }

  const createdAt = now();
  const submitNow = req.body.submitNow === 'true';
  const doc = {
    id: id('doc'),
    title: String(req.body.title || uploadInfo.originalName).trim().slice(0, 140),
    category: String(req.body.category || 'General').trim(),
    department: String(req.body.department || req.user.department || 'General').trim(),
    confidentiality: String(req.body.confidentiality || 'Internal').trim(),
    status: submitNow ? 'pending' : 'draft',
    ownerId: req.user.id,
    assignedTo,
    dueDate: String(req.body.dueDate || '').trim(),
    version: 1,
    versions: [],
    fileName: uploadInfo.originalName,
    storageName: file.filename,
    fileSize: file.size,
    mimeType: file.mimetype,
    fileKind: uploadInfo.profile.kind,
    hash: sha256(uploadInfo.buffer),
    submittedAt: submitNow ? createdAt : null,
    approvedAt: null,
    approvalReceipt: null,
    rejectionReason: '',
    notes: String(req.body.notes || '').trim(),
    comments: [],
    createdAt,
    updatedAt: createdAt
  };

  db.documents.unshift(doc);
  auditEvent(db, req, {
    documentId: doc.id,
    action: 'upload',
    details: `${doc.status === 'pending' ? 'Uploaded and submitted' : 'Uploaded draft'} ${doc.title}. SHA-256 ${doc.hash}.`
  });
  if (doc.status === 'pending') {
    auditEvent(db, req, { documentId: doc.id, action: 'submit', details: `Submitted ${doc.title} v${doc.version} for review.` });
  }
  saveDb(db);
  res.status(201).json({ document: attachNames(db, doc) });
});

router.post('/:id/versions', authRequired, upload.single('file'), (req, res) => {
  const db = req.db;
  const doc = db.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!canSeeDocument(req.user, doc)) {
    deleteUploadedFile(req.file);
    return deny(req, res, 404, 'Document not found.', `Attempted to upload a new version for hidden document ${doc.id}.`, doc.id);
  }
  if (doc.ownerId !== req.user.id && req.user.role !== 'admin') {
    deleteUploadedFile(req.file);
    return deny(req, res, 403, 'Only the owner or admin can upload a new version.', `Attempted version upload for ${doc.title}.`, doc.id);
  }
  if (doc.status === 'approved') {
    deleteUploadedFile(req.file);
    return res.status(409).json({ error: 'Approved documents are immutable. Upload a new document to start a new approval cycle.' });
  }

  let uploadInfo;
  try {
    uploadInfo = validateUploadedFile(req.file);
  } catch (error) {
    deleteUploadedFile(req.file);
    return res.status(error.status || 400).json({ error: error.message });
  }

  doc.versions = doc.versions || [];
  doc.versions.push({
    version: doc.version, fileName: doc.fileName, storageName: doc.storageName,
    fileSize: doc.fileSize, mimeType: doc.mimeType, hash: doc.hash,
    status: doc.status, submittedAt: doc.submittedAt, approvedAt: doc.approvedAt, archivedAt: now()
  });
  doc.version = Number(doc.version || 1) + 1;
  doc.fileName = uploadInfo.originalName;
  doc.storageName = req.file.filename;
  doc.fileSize = req.file.size;
  doc.mimeType = req.file.mimetype;
  doc.fileKind = uploadInfo.profile.kind;
  doc.hash = sha256(uploadInfo.buffer);
  doc.status = req.body.submitNow === 'true' ? 'pending' : 'draft';
  doc.submittedAt = doc.status === 'pending' ? now() : null;
  doc.approvedAt = null;
  doc.approvalReceipt = null;
  doc.rejectionReason = '';
  doc.notes = String(req.body.notes || doc.notes || '').trim();
  doc.updatedAt = now();

  auditEvent(db, req, { documentId: doc.id, action: 'version_upload', details: `Uploaded ${doc.title} v${doc.version}. SHA-256 ${doc.hash}.` });
  if (doc.status === 'pending') {
    auditEvent(db, req, { documentId: doc.id, action: 'submit', details: `Submitted ${doc.title} v${doc.version} for review.` });
  }
  saveDb(db);
  res.json({ document: attachNames(db, doc) });
});

router.patch('/:id/submit', authRequired, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!canSeeDocument(req.user, doc)) return deny(req, res, 404, 'Document not found.', `Attempted to submit hidden document ${doc.id}.`, doc.id);
  if (doc.ownerId !== req.user.id && req.user.role !== 'admin') return deny(req, res, 403, 'Only the owner or admin can submit this document.', `Attempted to submit ${doc.title}.`, doc.id);
  if (!['draft', 'changes_requested'].includes(doc.status)) return res.status(400).json({ error: 'Only drafts or change requests can be submitted.' });

  doc.status = 'pending';
  doc.submittedAt = now();
  doc.updatedAt = now();
  doc.rejectionReason = '';
  auditEvent(db, req, { documentId: doc.id, action: 'submit', details: `Submitted ${doc.title} v${doc.version} for review. SHA-256 ${doc.hash}.` });
  saveDb(db);
  res.json({ document: attachNames(db, doc) });
});

router.post('/:id/comment', authRequired, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!canSeeDocument(req.user, doc)) return deny(req, res, 404, 'Document not found.', `Attempted to comment on hidden document ${doc.id}.`, doc.id);
  const body = String(req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Comment cannot be empty.' });

  doc.comments = doc.comments || [];
  doc.comments.push({ id: id('cmt'), userId: req.user.id, body, createdAt: now() });
  doc.updatedAt = now();
  auditEvent(db, req, { documentId: doc.id, action: 'comment', details: `Added a comment to ${doc.title}.` });
  saveDb(db);
  res.json({ document: attachNames(db, doc) });
});

router.post('/:id/decision', authRequired, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!canSeeDocument(req.user, doc)) return deny(req, res, 404, 'Document not found.', `Attempted to decide hidden document ${doc.id}.`, doc.id);
  if (!canReviewDocument(req.user, doc)) return deny(req, res, 403, 'Only the assigned reviewer or admin can decide a pending document.', `Attempted decision on ${doc.title} while status was ${doc.status}.`, doc.id);

  const decision = String(req.body?.decision || '').trim();
  const note = String(req.body?.note || '').trim();
  const decisions = {
    approve:  ['approved',           'approve',          'Approved document and generated approval receipt.'],
    reject:   ['rejected',           'reject',           'Rejected document.'],
    changes:  ['changes_requested',  'request_changes',  'Requested changes before approval.']
  };
  const result = decisions[decision];
  if (!result) return res.status(400).json({ error: 'Decision must be approve, reject, or changes.' });
  if (decision !== 'approve' && !note) return res.status(400).json({ error: 'A note is required when rejecting or requesting changes.' });

  doc.status = result[0];
  doc.updatedAt = now();
  doc.approvedAt = decision === 'approve' ? now() : null;
  doc.approvalReceipt = decision === 'approve' ? {
    id: id('rcpt'), documentId: doc.id, documentTitle: doc.title,
    version: doc.version, hash: doc.hash, approvedAt: doc.approvedAt,
    approvedById: req.user.id, submitterId: doc.ownerId
  } : null;
  doc.rejectionReason = decision === 'approve' ? '' : note;
  doc.comments = doc.comments || [];
  doc.comments.push({ id: id('cmt'), userId: req.user.id, body: note || 'Approved. Approval receipt generated with hash verification.', createdAt: now() });

  auditEvent(db, req, { documentId: doc.id, action: result[1], details: `${result[2]} Version ${doc.version}. SHA-256 ${doc.hash}.` });
  saveDb(db);
  res.json({ document: attachNames(db, doc) });
});

router.patch('/:id/assign', authRequired, roleRequired('admin'), (req, res) => {
  const db = req.db;
  const doc = db.documents.find((d) => d.id === req.params.id);
  const reviewer = db.users.find((u) => u.id === req.body?.assignedTo && ['reviewer', 'admin'].includes(u.role));
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!reviewer) return res.status(400).json({ error: 'Choose a valid reviewer.' });

  doc.assignedTo = reviewer.id;
  doc.updatedAt = now();
  auditEvent(db, req, { documentId: doc.id, action: 'assign_reviewer', details: `Assigned ${doc.title} to ${reviewer.name}.` });
  saveDb(db);
  res.json({ document: attachNames(db, doc) });
});

router.get('/:id/download', authRequired, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!canSeeDocument(req.user, doc)) return deny(req, res, 404, 'Document not found.', `Attempted download for hidden document ${doc.id}.`, doc.id);
  if (!doc.storageName) return res.status(404).json({ error: 'Seed document has no physical file attached. Upload a new file to test downloads.' });

  const filePath = safeUploadPath(doc.storageName);
  if (!filePath) return res.status(404).json({ error: 'Stored file path is invalid.' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Uploaded file is missing from storage.' });

  auditEvent(db, req, { documentId: doc.id, action: 'download', details: `Downloaded ${doc.title} v${doc.version}.` });
  saveDb(db);
  res.download(filePath, doc.fileName);
});

export default router;
