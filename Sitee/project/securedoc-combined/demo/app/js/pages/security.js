import { icon } from '../icons.js';
import { sectionTitle } from './shell.js';

const SECURITY_CONTROLS = [
  {
    icon: 'users',
    title: 'Role-Based Access Control',
    text: 'Three roles with distinct permissions enforced on every API route. Submitters upload and track their own documents. Reviewers decide on documents assigned to them. Admins see all documents and audit events.',
    points: ['Submitter, Reviewer, Admin roles', 'Each role sees only permitted data', 'Failed access attempts logged in audit trail']
  },
  {
    icon: 'lock',
    title: 'Authentication & Sessions',
    text: 'Passwords are hashed with scrypt (64-byte key, per-user random salt). Login attempts are rate-limited per IP and email. Sessions use a cryptographically random 32-byte token and expire automatically.',
    points: ['scrypt password hashing — no MD5 or bcrypt shortcuts', 'Rate-limited: 5 attempts per 15 minutes', 'Sessions expire after 2 hours of inactivity']
  },
  {
    icon: 'upload',
    title: 'Secure File Uploads',
    text: 'Every uploaded file is validated at three levels before it is saved: declared extension, browser-supplied MIME type, and the actual file magic bytes. Files are stored with random UUIDs as names to prevent path traversal.',
    points: ['Extension + MIME + magic-byte validation', 'Path traversal prevention on all file routes', 'Random UUID storage names, 10 MB hard limit']
  },
  {
    icon: 'hash',
    title: 'SHA-256 Document Fingerprinting',
    text: 'A SHA-256 hash is computed from the raw file bytes at upload time and stored with the document record. On every document view the app re-reads the file and compares hashes, flagging any mismatch.',
    points: ['Hash computed server-side from raw bytes', 'Per-version hashes — each revision gets its own fingerprint', 'Real-time integrity verification on document open']
  },
  {
    icon: 'badge-check',
    title: 'Approval Receipts',
    text: 'When a reviewer approves a document, a receipt record is created that permanently ties the approval to the exact document version, file hash, approver identity and timestamp. The receipt is separate from the document and cannot be modified.',
    points: ['Receipt ID, approver, submitter, version', 'Hash locked at the moment of approval', 'Receipt shown on every subsequent document view']
  },
  {
    icon: 'clock',
    title: 'Tamper-Evident Audit Trail',
    text: 'Every significant action — login, logout, upload, submit, approve, reject, request-changes, comment, download, failed login, access denial — is appended as an immutable event. Each event includes a hash of the previous event, forming a chain.',
    points: ['Hash-chained events — any tampering breaks the chain', 'Actor, role, IP, timestamp on every event', 'Events are append-only; none can be edited or deleted']
  },
  {
    icon: 'shield',
    title: 'HTTP Security Headers',
    text: 'The server sets a strict Content Security Policy, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy no-referrer, and Permissions-Policy restricting camera, microphone, geolocation and payment APIs.',
    points: ['Content-Security-Policy: default-src self', 'Strict-Transport-Security (HSTS)', 'CORS restricted to configured origins only']
  }
];

export function securityPage() {
  return `
    ${sectionTitle('Security controls', 'Implemented controls for this document approval and audit workflow prototype.')}
    <div class="security-grid">
      ${SECURITY_CONTROLS.map((card) => `
        <article class="security-card">
          <div class="sc-ic">${icon(card.icon)}</div>
          <h3>${card.title}</h3>
          <p>${card.text}</p>
          <ul>${card.points.map((point) => `<li>${icon('check')}${point}</li>`).join('')}</ul>
        </article>
      `).join('')}
    </div>

    <div class="security-disclaimer">
      <div class="disclaimer-ic">${icon('alert-triangle')}</div>
      <div>
        <h3>Prototype scope and honest limitations</h3>
        <p>This is a <strong>secure approval workflow prototype</strong> built to demonstrate role-based access, document fingerprinting, and tamper-evident audit logging. It is not a production system and makes no compliance claims.</p>
        <ul>
          <li>${icon('x-circle')} <strong>Not an e-signature system.</strong> Approval receipts record a decision; they are not cryptographically signed documents and carry no legal weight.</li>
          <li>${icon('x-circle')} <strong>No SOC 2, HIPAA, or ISO 27001 compliance.</strong> Those require external audits, infrastructure controls, and operational processes beyond the scope of this prototype.</li>
          <li>${icon('x-circle')} <strong>Sessions are in-memory.</strong> A server restart clears all active sessions. Production use would require a persistent session store.</li>
          <li>${icon('x-circle')} <strong>JSON file storage.</strong> The data store is a single JSON file with no concurrency control. Not suitable for multi-user production load.</li>
          <li>${icon('x-circle')} <strong>Demo accounts only.</strong> There is no self-registration, password reset, or MFA. All accounts are seeded fixtures.</li>
        </ul>
      </div>
    </div>
  `;
}
