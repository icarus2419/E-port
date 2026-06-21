import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export const PORT = process.env.PORT || 8787;
export const DATA_DIR = path.join(ROOT, 'data');
export const UPLOAD_DIR = path.join(ROOT, 'uploads');
export const DB_FILE = path.join(DATA_DIR, 'db.json');
export const PUBLIC_DIR = path.join(ROOT, 'public');
export const LANDING_DIR = path.join(ROOT, 'landing-dist');
export const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MINUTES || 120) * 60 * 1000;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 5;
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived'
};

export const ROLE_NAMES = {
  submitter: 'Employee / Submitter',
  reviewer: 'Reviewer / Manager',
  admin: 'System Admin'
};

export const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:8787,http://127.0.0.1:8787')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
);

export const UPLOAD_PROFILES = [
  { kind: 'pdf',         extensions: ['.pdf'],        mimeTypes: ['application/pdf'],                                                                signatures: [[0x25, 0x50, 0x44, 0x46]] },
  { kind: 'word',        extensions: ['.doc'],         mimeTypes: ['application/msword'],                                                             signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]] },
  { kind: 'word',        extensions: ['.docx'],        mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],         signatures: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]] },
  { kind: 'spreadsheet', extensions: ['.xls'],         mimeTypes: ['application/vnd.ms-excel'],                                                        signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]] },
  { kind: 'spreadsheet', extensions: ['.xlsx'],        mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],               signatures: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]] },
  { kind: 'image',       extensions: ['.png'],         mimeTypes: ['image/png'],                                                                       signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  { kind: 'image',       extensions: ['.jpg', '.jpeg'], mimeTypes: ['image/jpeg'],                                                                     signatures: [[0xff, 0xd8, 0xff]] },
  { kind: 'text',        extensions: ['.txt'],         mimeTypes: ['text/plain'],                                                                       text: true }
];

export const allowedMimeTypes = new Set(UPLOAD_PROFILES.flatMap((p) => p.mimeTypes));
export const allowedExtensions = new Set(UPLOAD_PROFILES.flatMap((p) => p.extensions));
