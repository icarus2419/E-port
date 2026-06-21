import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_PROFILES } from './config.js';
import { safeOriginalName, safeUploadPath, sha256, now } from './crypto-utils.js';

export function uploadProfileFor(file) {
  const extension = path.extname(safeOriginalName(file.originalname)).toLowerCase();
  return UPLOAD_PROFILES.find((p) => p.extensions.includes(extension) && p.mimeTypes.includes(file.mimetype));
}

function startsWithBytes(buffer, signature) {
  if (!Buffer.isBuffer(buffer) || buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

function looksLikeText(buffer) {
  if (!buffer.length) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 512));
  return !sample.includes(0) && sample.every((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126) || b >= 128);
}

export function validateUploadedFile(file) {
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
    : profile.signatures.some((sig) => startsWithBytes(buffer, sig));

  if (!hasValidSignature) {
    const error = new Error('The file content does not match its extension or MIME type.');
    error.status = 400;
    throw error;
  }

  return { buffer, profile, originalName: safeOriginalName(file.originalname), filePath };
}

export function deleteUploadedFile(file) {
  if (!file?.filename) return;
  const filePath = safeUploadPath(file.filename);
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function fileIntegrity(doc) {
  if (!doc.storageName) {
    return {
      checkedAt: now(), available: false, verified: false, status: 'demo_record',
      expectedHash: doc.hash, currentHash: null,
      message: 'This seeded demo record has no local file attached. Upload a new document to verify bytes on disk.'
    };
  }

  const filePath = safeUploadPath(doc.storageName);
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      checkedAt: now(), available: false, verified: false, status: 'missing',
      expectedHash: doc.hash, currentHash: null,
      message: 'The stored file is missing or the storage path is invalid.'
    };
  }

  const currentHash = sha256(fs.readFileSync(filePath));
  const verified = currentHash === doc.hash;
  return {
    checkedAt: now(), available: true, verified,
    status: verified ? 'verified' : 'mismatch',
    expectedHash: doc.hash, currentHash,
    message: verified
      ? 'Stored file hash matches the document fingerprint.'
      : 'Stored file hash does not match the saved document fingerprint.'
  };
}
