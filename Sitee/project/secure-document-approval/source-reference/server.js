import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8787;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MINUTES || 120) * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const sessions = new Map();
const loginAttempts = new Map();

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived'
};

const ROLE_NAMES = {
  submitter: 'Employee / Submitter',
  reviewer: 'Reviewer / Manager',
  admin: 'System Admin'
};

const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:8787,http://127.0.0.1:8787')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const UPLOAD_PROFILES = [
  {
    kind: 'pdf',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    signatures: [[0x25, 0x50, 0x44, 0x46]]
  },
  {
    kind: 'word',
    extensions: ['.doc'],
    mimeTypes: ['application/msword'],
    signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]]
  },
  {
    kind: 'word',
    extensions: ['.docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    signatures: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]]
  },
  {
    kind: 'spreadsheet',
    extensions: ['.xls'],
    mimeTypes: ['application/vnd.ms-excel'],
    signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]]
  },
  {
    kind: 'spreadsheet',
    extensions: ['.xlsx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    signatures: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]]
  },
  {
    kind: 'image',
    extensions: ['.png'],
    mimeTypes: ['image/png'],
    signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]
  },
  {
    kind: 'image',
    extensions: ['.jpg', '.jpeg'],
    mimeTypes: ['image/jpeg'],
    signatures: [[0xff, 0xd8, 0xff]]
  },
  {
    kind: 'text',
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
    text: true
  }
];

const allowedMimeTypes = new Set(UPLOAD_PROFILES.flatMap((profile) => profile.mimeTypes));
const allowedExtensions = new Set(UPLOAD_PROFILES.flatMap((profile) => profile.extensions));

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    if (!stored || !stored.includes(':')) return false;
    const [salt, originalHash] = stored.split(':');
    const testHash = crypto.scryptSync(password, salt, 64);
    const original = Buffer.from(originalHash, 'hex');
    return original.length === testHash.length && crypto.timingSafeEqual(original, testHash);
  } catch (_error) {
    return false;
  }
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function safeOriginalName(name) {
  const basename = path.basename(String(name || 'document').replaceAll('\\', '/'));
  return basename.replace(/[^\w .()[\]-]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 180) || 'document';
}

function safeUploadPath(storageName) {
  const safeName = path.basename(String(storageName || ''));
  if (!safeName || safeName !== storageName) return null;
  const filePath = path.resolve(UPLOAD_DIR, safeName);
  if (!filePath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) return null;
  return filePath;
}

function uploadProfileFor(file) {
  const extension = path.extname(safeOriginalName(file.originalname)).toLowerCase();
  return UPLOAD_PROFILES.find((profile) => profile.extensions.includes(extension) && profile.mimeTypes.includes(file.mimetype));
}

function startsWithBytes(buffer, signature) {
  if (!Buffer.isBuffer(buffer) || buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

function looksLikeText(buffer) {
  if (!buffer.length) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 512));
  return !sample.includes(0) && sample.every((byte) => byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126) || byte >= 128);
}

function validateUploadedFile(file) {
  if (!file) {
    const error = new Error('Attach a document file first.');
    error.status = 400;
    throw error;
  }

  const profile = uploadProfileFor(file);
  if (!profile) {
    const error = new Error('Unsupported file type. Upload PDF, Word, Excel, PNG, JPG, or TXT files only.');
    error.status = 400;
    throw error;
  }

  const filePath = safeUploadPath(file.filename);
  if (!filePath || file.path !== filePath) {
    const error = new Error('The uploaded file path is invalid.');
    error.status = 400;
    throw error;
  }

  const buffer = fs.readFileSync(filePath);
  const hasValidSignature = profile.text
    ? looksLikeText(buffer)
    : profile.signatures.some((signature) => startsWithBytes(buffer, signature));

  if (!hasValidSignature) {
    const error = new Error('The file content does not match its extension or MIME type.');
    error.status = 400;
    throw error;
  }

  return {
    buffer,
    profile,
    originalName: safeOriginalName(file.originalname),
    filePath
  };
}

function deleteUploadedFile(file) {
  if (!file?.filename) return;
  const filePath = safeUploadPath(file.filename);
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function fileIntegrity(doc) {
  if (!doc.storageName) {
    return {
      checkedAt: now(),
      available: false,
      verified: false,
      status: 'demo_record',
      expectedHash: doc.hash,
      currentHash: null,
      message: 'This seeded demo record has no local file attached. Upload a new document to verify bytes on disk.'
    };
  }

  const filePath = safeUploadPath(doc.storageName);
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      checkedAt: now(),
      available: false,
      verified: false,
      status: 'missing',
      expectedHash: doc.hash,
      currentHash: null,
      message: 'The stored file is missing or the storage path is invalid.'
    };
  }

  const currentHash = sha256(fs.readFileSync(filePath));
  const verified = currentHash === doc.hash;
  return {
    checkedAt: now(),
    available: true,
    verified,
    status: verified ? 'verified' : 'mismatch',
    expectedHash: doc.hash,
    currentHash,
    message: verified ? 'Stored file hash matches the document fingerprint.' : 'Stored file hash does not match the saved document fingerprint.'
  };
}

function auditHash(event) {
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

function seedDatabase() {
  const password = 'demo123';
  const users = [
    {
      id: 'usr_submitter',
      name: 'Joseph Doyle-Samadi',
      email: 'employee@demo.com',
      role: 'submitter',
      department: 'Education Operations',
      passwordHash: hashPassword(password),
      avatar: 'JD'
    },
    {
      id: 'usr_reviewer',
      name: 'Maya Chen',
      email: 'reviewer@demo.com',
      role: 'reviewer',
      department: 'Review Office',
      passwordHash: hashPassword(password),
      avatar: 'MC'
    },
    {
      id: 'usr_admin',
      name: 'Alex Morgan',
      email: 'admin@demo.com',
      role: 'admin',
      department: 'Security & Compliance',
      passwordHash: hashPassword(password),
      avatar: 'AM'
    },
    {
      id: 'usr_reviewer_two',
      name: 'Sarah Patel',
      email: 'sarah.reviewer@demo.com',
      role: 'reviewer',
      department: 'Legal Review',
      passwordHash: hashPassword(password),
      avatar: 'SP'
    },
    {
      id: 'usr_employee_two',
      name: 'Daniel Brooks',
      email: 'daniel.employee@demo.com',
      role: 'submitter',
      department: 'Finance',
      passwordHash: hashPassword(password),
      avatar: 'DB'
    }
  ];

  const documents = [
    {
      id: 'doc_employment_contract',
      title: 'Employment Contract',
      category: 'HR',
      department: 'Education Operations',
      confidentiality: 'Restricted',
      status: 'pending',
      ownerId: 'usr_submitter',
      assignedTo: 'usr_reviewer',
      dueDate: '2026-06-24',
      version: 2,
      fileName: 'Employment Contract.pdf',
      storageName: null,
      fileSize: 482910,
      mimeType: 'application/pdf',
      hash: '87f38f12a9b0b30ed2e6248bb4820c7b146df7ab59cd6b13e7e49e8f8237ef21',
      submittedAt: '2026-06-18T09:12:00.000Z',
      approvedAt: null,
      rejectionReason: '',
      notes: 'Needs final reviewer approval before the employment package can be marked complete.',
      comments: [
        { id: 'cmt_1', userId: 'usr_reviewer', body: 'Checking signature block, start date, and compensation terms.', createdAt: '2026-06-18T10:05:00.000Z' }
      ],
      createdAt: '2026-06-18T09:00:00.000Z',
      updatedAt: '2026-06-18T10:05:00.000Z'
    },
    {
      id: 'doc_student_verification',
      title: 'Student Verification Form',
      category: 'Education',
      department: 'Education Operations',
      confidentiality: 'Confidential',
      status: 'approved',
      ownerId: 'usr_submitter',
      assignedTo: 'usr_reviewer',
      dueDate: '2026-06-20',
      version: 1,
      fileName: 'Student Verification Form.pdf',
      storageName: null,
      fileSize: 188440,
      mimeType: 'application/pdf',
      hash: '43b3752e27b5827b70d412099f2ce65016f6d476eb9f3954acc7d968b3e7cd6d',
      submittedAt: '2026-06-16T11:05:00.000Z',
      approvedAt: '2026-06-16T15:25:00.000Z',
      rejectionReason: '',
      notes: 'Approved verification package for onboarding evidence.',
      comments: [
        { id: 'cmt_2', userId: 'usr_reviewer', body: 'Approved. Form matches required verification details.', createdAt: '2026-06-16T15:25:00.000Z' }
      ],
      createdAt: '2026-06-16T10:55:00.000Z',
      updatedAt: '2026-06-16T15:25:00.000Z'
    },
    {
      id: 'doc_vendor_agreement',
      title: 'Vendor Agreement',
      category: 'Legal',
      department: 'Operations',
      confidentiality: 'Restricted',
      status: 'pending',
      ownerId: 'usr_employee_two',
      assignedTo: 'usr_reviewer_two',
      dueDate: '2026-06-25',
      version: 3,
      fileName: 'Vendor Agreement.pdf',
      storageName: null,
      fileSize: 521904,
      mimeType: 'application/pdf',
      hash: 'c5c5931ff5a678e9625d3c1d74f56125c157e18d1c0be222b3c50eb5c5bb11ff',
      submittedAt: '2026-06-18T13:30:00.000Z',
      approvedAt: null,
      rejectionReason: '',
      notes: 'Renewal agreement requires legal review before signature.',
      comments: [],
      createdAt: '2026-06-18T13:12:00.000Z',
      updatedAt: '2026-06-18T13:30:00.000Z'
    },
    {
      id: 'doc_policy_update',
      title: 'Policy Update',
      category: 'Compliance',
      department: 'People',
      confidentiality: 'Internal',
      status: 'changes_requested',
      ownerId: 'usr_submitter',
      assignedTo: 'usr_reviewer',
      dueDate: '2026-06-21',
      version: 2,
      fileName: 'Policy Update.docx',
      storageName: null,
      fileSize: 231804,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      hash: '9436e84eb66b814d54409d39fd4710c116590a4c84439a40dd853711d0a0a10a',
      submittedAt: '2026-06-17T14:20:00.000Z',
      approvedAt: null,
      rejectionReason: 'Clarify who can approve exceptions and add a review date before resubmitting.',
      notes: 'Updated internal policy after leadership review.',
      comments: [
        { id: 'cmt_3', userId: 'usr_reviewer', body: 'Please tighten the exception approval wording.', createdAt: '2026-06-17T16:40:00.000Z' }
      ],
      createdAt: '2026-06-17T13:50:00.000Z',
      updatedAt: '2026-06-17T16:40:00.000Z'
    },
    {
      id: 'doc_transcript_request',
      title: 'Transcript Request',
      category: 'Education',
      department: 'Education Operations',
      confidentiality: 'Confidential',
      status: 'draft',
      ownerId: 'usr_submitter',
      assignedTo: 'usr_reviewer',
      dueDate: '2026-06-28',
      version: 1,
      fileName: 'Transcript Request.pdf',
      storageName: null,
      fileSize: 91022,
      mimeType: 'application/pdf',
      hash: '58ad2e0b8e542720fa08798a517969adf8856c4c9b305b820bdad0a1232b4012',
      submittedAt: null,
      approvedAt: null,
      rejectionReason: '',
      notes: 'Draft saved by submitter. Not visible in reviewer queue until submitted.',
      comments: [],
      createdAt: '2026-06-18T12:15:00.000Z',
      updatedAt: '2026-06-18T12:15:00.000Z'
    },
    {
      id: 'doc_onboarding_checklist',
      title: 'Onboarding Checklist',
      category: 'HR',
      department: 'People',
      confidentiality: 'Internal',
      status: 'approved',
      ownerId: 'usr_employee_two',
      assignedTo: 'usr_reviewer_two',
      dueDate: '2026-06-18',
      version: 1,
      fileName: 'Onboarding Checklist.pdf',
      storageName: null,
      fileSize: 160204,
      mimeType: 'application/pdf',
      hash: '7c01509ae23747f6172332fc3cb648bb49f08a5bdf9c8d71e52bd17a310bf235',
      submittedAt: '2026-06-15T09:45:00.000Z',
      approvedAt: '2026-06-15T12:10:00.000Z',
      rejectionReason: '',
      notes: 'Checklist verified and stored for onboarding evidence.',
      comments: [
        { id: 'cmt_4', userId: 'usr_reviewer_two', body: 'Approved. All required onboarding items are present.', createdAt: '2026-06-15T12:10:00.000Z' }
      ],
      createdAt: '2026-06-15T09:20:00.000Z',
      updatedAt: '2026-06-15T12:10:00.000Z'
    },
    {
      id: 'doc_insurance_confirmation',
      title: 'Insurance Confirmation',
      category: 'Finance',
      department: 'Finance',
      confidentiality: 'Confidential',
      status: 'rejected',
      ownerId: 'usr_employee_two',
      assignedTo: 'usr_reviewer',
      dueDate: '2026-06-19',
      version: 1,
      fileName: 'Insurance Confirmation.pdf',
      storageName: null,
      fileSize: 204991,
      mimeType: 'application/pdf',
      hash: 'bed1ecab7fb3be87317aee0b4dc41d8a91f35f47d66a5a975c89c7e82249d2f1',
      submittedAt: '2026-06-14T13:15:00.000Z',
      approvedAt: null,
      rejectionReason: 'Document is missing the policy number and coverage period.',
      notes: 'Needs corrected supporting evidence before it can be accepted.',
      comments: [
        { id: 'cmt_5', userId: 'usr_reviewer', body: 'Rejected until the missing policy information is included.', createdAt: '2026-06-14T16:05:00.000Z' }
      ],
      createdAt: '2026-06-14T13:00:00.000Z',
      updatedAt: '2026-06-14T16:05:00.000Z'
    }
  ];

  const audit = [
    { id: 'aud_001', documentId: 'doc_employment_contract', actorId: 'usr_submitter', action: 'submitted_document', message: 'Submitted Employment Contract for approval.', ip: '127.0.0.1', createdAt: '2026-06-18T09:12:00.000Z' },
    { id: 'aud_002', documentId: 'doc_employment_contract', actorId: 'usr_reviewer', action: 'commented', message: 'Added review comment.', ip: '127.0.0.1', createdAt: '2026-06-18T10:05:00.000Z' },
    { id: 'aud_003', documentId: 'doc_policy_update', actorId: 'usr_reviewer', action: 'requested_changes', message: 'Requested changes before approval. Hash: 9436e84eb66b...', ip: '127.0.0.1', createdAt: '2026-06-17T16:40:00.000Z' },
    { id: 'aud_004', documentId: 'doc_student_verification', actorId: 'usr_reviewer', action: 'approved_document', message: 'Approved document and generated approval receipt. Hash: 43b3752e27b5...', ip: '127.0.0.1', createdAt: '2026-06-16T15:25:00.000Z' },
    { id: 'aud_005', documentId: 'doc_vendor_agreement', actorId: 'usr_employee_two', action: 'uploaded_and_submitted', message: 'Uploaded and submitted Vendor Agreement.', ip: '127.0.0.1', createdAt: '2026-06-18T13:30:00.000Z' },
    { id: 'aud_006', documentId: 'doc_insurance_confirmation', actorId: 'usr_reviewer', action: 'rejected_document', message: 'Rejected document. Hash: bed1ecab7fb3...', ip: '127.0.0.1', createdAt: '2026-06-14T16:05:00.000Z' }
  ];

  return { users, documents, audit, meta: { createdAt: now(), updatedAt: now() } };
}

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const seeded = seedDatabase();
    normalizeDb(seeded);
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const changed = normalizeDb(db);
  if (changed) saveDb(db);
  return db;
}

function saveDb(db) {
  db.meta = { ...(db.meta || {}), updatedAt: now() };
  const temp = `${DB_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2));
  fs.renameSync(temp, DB_FILE);
}

function normalizeDb(db) {
  let changed = false;
  db.users = Array.isArray(db.users) ? db.users : [];
  db.documents = Array.isArray(db.documents) ? db.documents : [];
  db.audit = Array.isArray(db.audit) ? db.audit : [];

  db.documents.forEach((doc) => {
    doc.version = Number(doc.version || 1);
    doc.versions = Array.isArray(doc.versions) ? doc.versions : [];
    doc.comments = Array.isArray(doc.comments) ? doc.comments : [];
    if (doc.status === 'approved' && !doc.approvalReceipt) {
      doc.approvalReceipt = {
        id: `rcpt_${doc.id.replace(/^doc_/, '')}`,
        hash: doc.hash,
        approvedAt: doc.approvedAt || doc.updatedAt || doc.createdAt || now(),
        approvedById: doc.comments.find((comment) => comment.body?.toLowerCase().includes('approved'))?.userId || doc.assignedTo || null
      };
      changed = true;
    }
  });

  let previousHash = 'GENESIS';
  db.audit.forEach((event) => {
    const actor = db.users.find((user) => user.id === event.actorId);
    if (!event.details && event.message) {
      event.details = event.message;
      changed = true;
    }
    if (event.message) {
      delete event.message;
      changed = true;
    }
    if (!event.status) {
      event.status = 'success';
      changed = true;
    }
    if (!event.actorRole) {
      event.actorRole = actor?.role || (event.actorId ? 'unknown' : 'anonymous');
      changed = true;
    }
    if (!event.createdAt) {
      event.createdAt = now();
      changed = true;
    }
    if (event.previousHash !== previousHash) {
      event.previousHash = previousHash;
      changed = true;
    }
    const nextHash = auditHash(event);
    if (event.eventHash !== nextHash) {
      event.eventHash = nextHash;
      changed = true;
    }
    previousHash = event.eventHash;
  });

  db.meta = {
    ...(db.meta || {}),
    storage: 'json-file',
    auditHashChained: true,
    demoOnly: true,
    updatedAt: db.meta?.updatedAt || now()
  };

  return changed;
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return { ...safe, roleName: ROLE_NAMES[user.role] || user.role };
}

function attachNames(db, doc) {
  const owner = db.users.find((user) => user.id === doc.ownerId);
  const reviewer = db.users.find((user) => user.id === doc.assignedTo);
  const approvalReceipt = doc.approvalReceipt ? {
    ...doc.approvalReceipt,
    approver: publicUser(db.users.find((user) => user.id === doc.approvalReceipt.approvedById))
  } : null;
  return {
    ...doc,
    statusLabel: STATUS_LABELS[doc.status] || doc.status,
    owner: publicUser(owner),
    reviewer: publicUser(reviewer),
    integrity: fileIntegrity(doc),
    approvalReceipt,
    comments: (doc.comments || []).map((comment) => ({
      ...comment,
      user: publicUser(db.users.find((user) => user.id === comment.userId))
    }))
  };
}

function canSeeDocument(user, doc) {
  if (user.role === 'admin') return true;
  if (doc.ownerId === user.id) return true;
  if (doc.assignedTo === user.id && doc.status !== 'draft') return true;
  return false;
}

function canReviewDocument(user, doc) {
  if (doc.status !== 'pending') return false;
  if (user.role === 'admin') return true;
  return user.role === 'reviewer' && doc.assignedTo === user.id && doc.status === 'pending';
}

function auditEvent(db, req, { documentId = null, action, details = '', status = 'success' }) {
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
    createdAt: now()
  };
  event.previousHash = previousHash;
  event.eventHash = auditHash(event);
  db.audit.push(event);
  return event;
}

function auditFailure(req, { documentId = null, details }) {
  auditEvent(req.db, req, {
    documentId,
    action: 'failed_permission',
    status: 'denied',
    details
  });
  saveDb(req.db);
}

function deny(req, res, status, error, details, documentId = null) {
  if (req.db && req.user) auditFailure(req, { documentId, details });
  return res.status(status).json({ error });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = path.extname(safeOriginalName(file.originalname)).toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
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

function securityHeaders(_req, res, next) {
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

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  next();
});
app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    const error = new Error('CORS origin is not allowed.');
    error.status = 403;
    return cb(error);
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));

function authRequired(req, res, next) {
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

  const user = db.users.find((candidate) => candidate.id === session.userId);
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

function roleRequired(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return deny(
        req,
        res,
        403,
        'Your role is not allowed to perform this action.',
        `Role ${req.user.role} attempted an action restricted to ${roles.join(', ')}.`
      );
    }
    return next();
  };
}

function loginKey(req, email) {
  return `${req.ip || 'local'}:${String(email || '').toLowerCase()}`;
}

function loginAttemptState(req, email) {
  const key = loginKey(req, email);
  const current = loginAttempts.get(key);
  if (!current || Date.now() > current.resetAt) {
    const fresh = { count: 0, resetAt: Date.now() + LOGIN_WINDOW_MS };
    loginAttempts.set(key, fresh);
    return fresh;
  }
  return current;
}

function clearLoginAttempts(req, email) {
  loginAttempts.delete(loginKey(req, email));
}

function publicSession(session) {
  return {
    expiresAt: new Date(session.expiresAt).toISOString(),
    ttlMinutes: Math.round((session.expiresAt - Date.now()) / 60000)
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'SecureDoc Approval', time: now() });
});

app.post('/api/auth/login', (req, res) => {
  const db = loadDb();
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const attempts = loginAttemptState(req, normalizedEmail);

  if (attempts.count >= LOGIN_MAX_ATTEMPTS) {
    auditEvent(db, { ip: req.ip, actorRole: 'anonymous' }, {
      action: 'failed_login',
      status: 'blocked',
      details: `Rate-limited login attempt for ${normalizedEmail || 'blank email'}.`
    });
    saveDb(db);
    return res.status(429).json({ error: 'Too many login attempts. Wait a few minutes and try again.' });
  }

  const user = db.users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);

  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
    attempts.count += 1;
    auditEvent(db, { ip: req.ip, actorRole: 'anonymous' }, {
      action: 'failed_login',
      status: 'failed',
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

app.post('/api/auth/logout', authRequired, (req, res) => {
  sessions.delete(req.token);
  auditEvent(req.db, req, { action: 'logout', details: `${req.user.name} logged out.` });
  saveDb(req.db);
  res.json({ ok: true });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user), session: publicSession(req.session), demoOnly: true });
});

app.get('/api/users/reviewers', authRequired, (req, res) => {
  const reviewers = req.db.users.filter((user) => user.role === 'reviewer' || user.role === 'admin').map(publicUser);
  res.json({ reviewers });
});

app.get('/api/documents', authRequired, (req, res) => {
  const docs = req.db.documents
    .filter((doc) => canSeeDocument(req.user, doc))
    .map((doc) => attachNames(req.db, doc))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ documents: docs });
});

app.post('/api/documents', authRequired, roleRequired('submitter', 'admin'), upload.single('file'), (req, res) => {
  const db = req.db;
  const file = req.file;
  let uploadInfo;

  try {
    uploadInfo = validateUploadedFile(file);
  } catch (error) {
    deleteUploadedFile(file);
    return res.status(error.status || 400).json({ error: error.message });
  }

  const assignedTo = req.body.assignedTo || db.users.find((user) => user.role === 'reviewer')?.id;
  const reviewerExists = db.users.some((user) => user.id === assignedTo && ['reviewer', 'admin'].includes(user.role));
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

app.post('/api/documents/:id/versions', authRequired, upload.single('file'), (req, res) => {
  const db = req.db;
  const doc = db.documents.find((candidate) => candidate.id === req.params.id);
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

  const previousVersion = {
    version: doc.version,
    fileName: doc.fileName,
    storageName: doc.storageName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    hash: doc.hash,
    status: doc.status,
    submittedAt: doc.submittedAt,
    approvedAt: doc.approvedAt,
    archivedAt: now()
  };
  doc.versions = doc.versions || [];
  doc.versions.push(previousVersion);
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

  auditEvent(db, req, {
    documentId: doc.id,
    action: 'version_upload',
    details: `Uploaded ${doc.title} v${doc.version}. SHA-256 ${doc.hash}.`
  });
  if (doc.status === 'pending') {
    auditEvent(db, req, { documentId: doc.id, action: 'submit', details: `Submitted ${doc.title} v${doc.version} for review.` });
  }
  saveDb(db);
  res.json({ document: attachNames(db, doc) });
});

app.patch('/api/documents/:id/submit', authRequired, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((candidate) => candidate.id === req.params.id);
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

app.post('/api/documents/:id/comment', authRequired, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((candidate) => candidate.id === req.params.id);
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

app.post('/api/documents/:id/decision', authRequired, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((candidate) => candidate.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!canSeeDocument(req.user, doc)) return deny(req, res, 404, 'Document not found.', `Attempted to decide hidden document ${doc.id}.`, doc.id);
  if (!canReviewDocument(req.user, doc)) return deny(req, res, 403, 'Only the assigned reviewer or admin can decide a pending document.', `Attempted decision on ${doc.title} while status was ${doc.status}.`, doc.id);

  const decision = String(req.body?.decision || '').trim();
  const note = String(req.body?.note || '').trim();
  const decisions = {
    approve: ['approved', 'approve', 'Approved document and generated approval receipt.'],
    reject: ['rejected', 'reject', 'Rejected document.'],
    changes: ['changes_requested', 'request_changes', 'Requested changes before approval.']
  };
  const result = decisions[decision];
  if (!result) return res.status(400).json({ error: 'Decision must be approve, reject, or changes.' });
  if (decision !== 'approve' && !note) return res.status(400).json({ error: 'A note is required when rejecting or requesting changes.' });

  doc.status = result[0];
  doc.updatedAt = now();
  doc.approvedAt = decision === 'approve' ? now() : null;
  doc.approvalReceipt = decision === 'approve' ? {
    id: id('rcpt'),
    documentId: doc.id,
    documentTitle: doc.title,
    version: doc.version,
    hash: doc.hash,
    approvedAt: doc.approvedAt,
    approvedById: req.user.id,
    submitterId: doc.ownerId
  } : null;
  doc.rejectionReason = decision === 'approve' ? '' : note;
  doc.comments = doc.comments || [];
  doc.comments.push({
    id: id('cmt'),
    userId: req.user.id,
    body: note || 'Approved. Approval receipt generated with hash verification.',
    createdAt: now()
  });

  auditEvent(db, req, { documentId: doc.id, action: result[1], details: `${result[2]} Version ${doc.version}. SHA-256 ${doc.hash}.` });
  saveDb(db);
  res.json({ document: attachNames(db, doc) });
});

app.patch('/api/documents/:id/assign', authRequired, roleRequired('admin'), (req, res) => {
  const db = req.db;
  const doc = db.documents.find((candidate) => candidate.id === req.params.id);
  const reviewer = db.users.find((user) => user.id === req.body?.assignedTo && ['reviewer', 'admin'].includes(user.role));
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!reviewer) return res.status(400).json({ error: 'Choose a valid reviewer.' });

  doc.assignedTo = reviewer.id;
  doc.updatedAt = now();
  auditEvent(db, req, { documentId: doc.id, action: 'assign_reviewer', details: `Assigned ${doc.title} to ${reviewer.name}.` });
  saveDb(db);
  res.json({ document: attachNames(db, doc) });
});

app.get('/api/documents/:id/download', authRequired, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((candidate) => candidate.id === req.params.id);
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

app.get('/api/audit', authRequired, (req, res) => {
  const visibleDocumentIds = new Set(req.db.documents.filter((doc) => canSeeDocument(req.user, doc)).map((doc) => doc.id));
  const { action = '', user = '', document = '', status = '' } = req.query || {};
  const events = req.db.audit
    .filter((event) => {
      const documentVisible = event.documentId ? (req.user.role === 'admin' || visibleDocumentIds.has(event.documentId)) : (req.user.role === 'admin' || event.actorId === req.user.id);
      if (!documentVisible) return false;
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
      actor: publicUser(req.db.users.find((user) => user.id === event.actorId)),
      document: req.db.documents.find((doc) => doc.id === event.documentId) || null
    }));
  res.json({ audit: events });
});

app.get('/api/stats', authRequired, (req, res) => {
  const docs = req.db.documents.filter((doc) => canSeeDocument(req.user, doc));
  const byStatus = docs.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {});
  const pendingForMe = docs.filter((doc) => doc.status === 'pending' && (req.user.role === 'admin' || doc.assignedTo === req.user.id)).length;
  const mySubmissions = docs.filter((doc) => doc.ownerId === req.user.id).length;
  const verifiedFiles = docs.filter((doc) => fileIntegrity(doc).verified).length;
  const totalFileSize = docs.reduce((sum, doc) => sum + Number(doc.fileSize || 0), 0);

  res.json({
    total: docs.length,
    pendingForMe,
    mySubmissions,
    approved: byStatus.approved || 0,
    changesRequested: byStatus.changes_requested || 0,
    verifiedFiles,
    totalFileSize,
    byStatus
  });
});

app.use('/api', (err, _req, res, _next) => {
  console.error(err);
  const status = err?.status || err?.statusCode || (err?.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
  let message = 'Unexpected server error.';
  if (err?.code === 'LIMIT_FILE_SIZE') message = 'File exceeds the 10 MB upload limit.';
  else if (status < 500 && err?.message) message = err.message;
  res.status(status).json({ error: message });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const server = app.listen(PORT, (error) => {
  if (error) {
    console.error('SecureDoc failed to start:', error.message);
    process.exitCode = 1;
    return;
  }
  loadDb();
  console.log(`SecureDoc Approval is running at http://localhost:${PORT}`);
  console.log('Demo-only accounts: employee@demo.com / reviewer@demo.com / admin@demo.com, password demo123');
  console.log(`Demo sessions expire after ${Math.round(SESSION_TTL_MS / 60000)} minutes.`);
});

server.on('error', (error) => {
  console.error('SecureDoc server error:', error.message);
  process.exitCode = 1;
});
