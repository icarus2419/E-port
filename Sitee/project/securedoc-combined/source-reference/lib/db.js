import fs from 'node:fs';
import { DATA_DIR, UPLOAD_DIR, DB_FILE } from './config.js';
import { now, hashPassword, auditHash } from './crypto-utils.js';

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function seedDatabase() {
  const password = 'demo123';
  const users = [
    { id: 'usr_submitter',    name: 'Joseph Doyle-Samadi', email: 'employee@demo.com',       role: 'submitter', department: 'Education Operations', passwordHash: hashPassword(password), avatar: 'JD' },
    { id: 'usr_reviewer',     name: 'Maya Chen',           email: 'reviewer@demo.com',        role: 'reviewer',  department: 'Review Office',         passwordHash: hashPassword(password), avatar: 'MC' },
    { id: 'usr_admin',        name: 'Alex Morgan',         email: 'admin@demo.com',           role: 'admin',     department: 'Security & Compliance', passwordHash: hashPassword(password), avatar: 'AM' },
    { id: 'usr_reviewer_two', name: 'Sarah Patel',         email: 'sarah.reviewer@demo.com',  role: 'reviewer',  department: 'Legal Review',          passwordHash: hashPassword(password), avatar: 'SP' },
    { id: 'usr_employee_two', name: 'Daniel Brooks',       email: 'daniel.employee@demo.com', role: 'submitter', department: 'Finance',               passwordHash: hashPassword(password), avatar: 'DB' }
  ];

  const documents = [
    {
      id: 'doc_employment_contract', title: 'Employment Contract', category: 'HR', department: 'Education Operations',
      confidentiality: 'Restricted', status: 'pending', ownerId: 'usr_submitter', assignedTo: 'usr_reviewer',
      dueDate: '2026-06-24', version: 2, fileName: 'Employment Contract.pdf', storageName: null,
      fileSize: 482910, mimeType: 'application/pdf',
      hash: '87f38f12a9b0b30ed2e6248bb4820c7b146df7ab59cd6b13e7e49e8f8237ef21',
      submittedAt: '2026-06-18T09:12:00.000Z', approvedAt: null, rejectionReason: '',
      notes: 'Needs final reviewer approval before the employment package can be marked complete.',
      comments: [{ id: 'cmt_1', userId: 'usr_reviewer', body: 'Checking signature block, start date, and compensation terms.', createdAt: '2026-06-18T10:05:00.000Z' }],
      createdAt: '2026-06-18T09:00:00.000Z', updatedAt: '2026-06-18T10:05:00.000Z'
    },
    {
      id: 'doc_student_verification', title: 'Student Verification Form', category: 'Education', department: 'Education Operations',
      confidentiality: 'Confidential', status: 'approved', ownerId: 'usr_submitter', assignedTo: 'usr_reviewer',
      dueDate: '2026-06-20', version: 1, fileName: 'Student Verification Form.pdf', storageName: null,
      fileSize: 188440, mimeType: 'application/pdf',
      hash: '43b3752e27b5827b70d412099f2ce65016f6d476eb9f3954acc7d968b3e7cd6d',
      submittedAt: '2026-06-16T11:05:00.000Z', approvedAt: '2026-06-16T15:25:00.000Z', rejectionReason: '',
      notes: 'Approved verification package for onboarding evidence.',
      comments: [{ id: 'cmt_2', userId: 'usr_reviewer', body: 'Approved. Form matches required verification details.', createdAt: '2026-06-16T15:25:00.000Z' }],
      createdAt: '2026-06-16T10:55:00.000Z', updatedAt: '2026-06-16T15:25:00.000Z'
    },
    {
      id: 'doc_vendor_agreement', title: 'Vendor Agreement', category: 'Legal', department: 'Operations',
      confidentiality: 'Restricted', status: 'pending', ownerId: 'usr_employee_two', assignedTo: 'usr_reviewer_two',
      dueDate: '2026-06-25', version: 3, fileName: 'Vendor Agreement.pdf', storageName: null,
      fileSize: 521904, mimeType: 'application/pdf',
      hash: 'c5c5931ff5a678e9625d3c1d74f56125c157e18d1c0be222b3c50eb5c5bb11ff',
      submittedAt: '2026-06-18T13:30:00.000Z', approvedAt: null, rejectionReason: '',
      notes: 'Renewal agreement requires legal review before signature.',
      comments: [], createdAt: '2026-06-18T13:12:00.000Z', updatedAt: '2026-06-18T13:30:00.000Z'
    },
    {
      id: 'doc_policy_update', title: 'Policy Update', category: 'Compliance', department: 'People',
      confidentiality: 'Internal', status: 'changes_requested', ownerId: 'usr_submitter', assignedTo: 'usr_reviewer',
      dueDate: '2026-06-21', version: 2, fileName: 'Policy Update.docx', storageName: null,
      fileSize: 231804, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      hash: '9436e84eb66b814d54409d39fd4710c116590a4c84439a40dd853711d0a0a10a',
      submittedAt: '2026-06-17T14:20:00.000Z', approvedAt: null,
      rejectionReason: 'Clarify who can approve exceptions and add a review date before resubmitting.',
      notes: 'Updated internal policy after leadership review.',
      comments: [{ id: 'cmt_3', userId: 'usr_reviewer', body: 'Please tighten the exception approval wording.', createdAt: '2026-06-17T16:40:00.000Z' }],
      createdAt: '2026-06-17T13:50:00.000Z', updatedAt: '2026-06-17T16:40:00.000Z'
    },
    {
      id: 'doc_transcript_request', title: 'Transcript Request', category: 'Education', department: 'Education Operations',
      confidentiality: 'Confidential', status: 'draft', ownerId: 'usr_submitter', assignedTo: 'usr_reviewer',
      dueDate: '2026-06-28', version: 1, fileName: 'Transcript Request.pdf', storageName: null,
      fileSize: 91022, mimeType: 'application/pdf',
      hash: '58ad2e0b8e542720fa08798a517969adf8856c4c9b305b820bdad0a1232b4012',
      submittedAt: null, approvedAt: null, rejectionReason: '',
      notes: 'Draft saved by submitter. Not visible in reviewer queue until submitted.',
      comments: [], createdAt: '2026-06-18T12:15:00.000Z', updatedAt: '2026-06-18T12:15:00.000Z'
    },
    {
      id: 'doc_onboarding_checklist', title: 'Onboarding Checklist', category: 'HR', department: 'People',
      confidentiality: 'Internal', status: 'approved', ownerId: 'usr_employee_two', assignedTo: 'usr_reviewer_two',
      dueDate: '2026-06-18', version: 1, fileName: 'Onboarding Checklist.pdf', storageName: null,
      fileSize: 160204, mimeType: 'application/pdf',
      hash: '7c01509ae23747f6172332fc3cb648bb49f08a5bdf9c8d71e52bd17a310bf235',
      submittedAt: '2026-06-15T09:45:00.000Z', approvedAt: '2026-06-15T12:10:00.000Z', rejectionReason: '',
      notes: 'Checklist verified and stored for onboarding evidence.',
      comments: [{ id: 'cmt_4', userId: 'usr_reviewer_two', body: 'Approved. All required onboarding items are present.', createdAt: '2026-06-15T12:10:00.000Z' }],
      createdAt: '2026-06-15T09:20:00.000Z', updatedAt: '2026-06-15T12:10:00.000Z'
    },
    {
      id: 'doc_insurance_confirmation', title: 'Insurance Confirmation', category: 'Finance', department: 'Finance',
      confidentiality: 'Confidential', status: 'rejected', ownerId: 'usr_employee_two', assignedTo: 'usr_reviewer',
      dueDate: '2026-06-19', version: 1, fileName: 'Insurance Confirmation.pdf', storageName: null,
      fileSize: 204991, mimeType: 'application/pdf',
      hash: 'bed1ecab7fb3be87317aee0b4dc41d8a91f35f47d66a5a975c89c7e82249d2f1',
      submittedAt: '2026-06-14T13:15:00.000Z', approvedAt: null,
      rejectionReason: 'Document is missing the policy number and coverage period.',
      notes: 'Needs corrected supporting evidence before it can be accepted.',
      comments: [{ id: 'cmt_5', userId: 'usr_reviewer', body: 'Rejected until the missing policy information is included.', createdAt: '2026-06-14T16:05:00.000Z' }],
      createdAt: '2026-06-14T13:00:00.000Z', updatedAt: '2026-06-14T16:05:00.000Z'
    }
  ];

  const audit = [
    { id: 'aud_001', documentId: 'doc_employment_contract',  actorId: 'usr_submitter',    action: 'submitted_document',    message: 'Submitted Employment Contract for approval.',                                ip: '127.0.0.1', createdAt: '2026-06-18T09:12:00.000Z' },
    { id: 'aud_002', documentId: 'doc_employment_contract',  actorId: 'usr_reviewer',     action: 'commented',             message: 'Added review comment.',                                                      ip: '127.0.0.1', createdAt: '2026-06-18T10:05:00.000Z' },
    { id: 'aud_003', documentId: 'doc_policy_update',        actorId: 'usr_reviewer',     action: 'requested_changes',     message: 'Requested changes before approval. Hash: 9436e84eb66b...',                  ip: '127.0.0.1', createdAt: '2026-06-17T16:40:00.000Z' },
    { id: 'aud_004', documentId: 'doc_student_verification', actorId: 'usr_reviewer',     action: 'approved_document',     message: 'Approved document and generated approval receipt. Hash: 43b3752e27b5...',   ip: '127.0.0.1', createdAt: '2026-06-16T15:25:00.000Z' },
    { id: 'aud_005', documentId: 'doc_vendor_agreement',     actorId: 'usr_employee_two', action: 'uploaded_and_submitted', message: 'Uploaded and submitted Vendor Agreement.',                                 ip: '127.0.0.1', createdAt: '2026-06-18T13:30:00.000Z' },
    { id: 'aud_006', documentId: 'doc_insurance_confirmation', actorId: 'usr_reviewer',   action: 'rejected_document',     message: 'Rejected document. Hash: bed1ecab7fb3...',                                  ip: '127.0.0.1', createdAt: '2026-06-14T16:05:00.000Z' }
  ];

  return { users, documents, audit, meta: { createdAt: now(), updatedAt: now() } };
}

export function normalizeDb(db) {
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
        approvedById: doc.comments.find((c) => c.body?.toLowerCase().includes('approved'))?.userId || doc.assignedTo || null
      };
      changed = true;
    }
  });

  let previousHash = 'GENESIS';
  db.audit.forEach((event) => {
    const actor = db.users.find((u) => u.id === event.actorId);
    if (!event.details && event.message) { event.details = event.message; changed = true; }
    if (event.message) { delete event.message; changed = true; }
    if (!event.status)    { event.status = 'success'; changed = true; }
    if (!event.actorRole) { event.actorRole = actor?.role || (event.actorId ? 'unknown' : 'anonymous'); changed = true; }
    if (!event.createdAt) { event.createdAt = now(); changed = true; }
    if (event.previousHash !== previousHash) { event.previousHash = previousHash; changed = true; }
    const nextHash = auditHash(event);
    if (event.eventHash !== nextHash) { event.eventHash = nextHash; changed = true; }
    previousHash = event.eventHash;
  });

  db.meta = { ...(db.meta || {}), storage: 'json-file', auditHashChained: true, demoOnly: true, updatedAt: db.meta?.updatedAt || now() };
  return changed;
}

export function saveDb(db) {
  db.meta = { ...(db.meta || {}), updatedAt: now() };
  const temp = `${DB_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2));
  fs.renameSync(temp, DB_FILE);
}

export function loadDb() {
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
