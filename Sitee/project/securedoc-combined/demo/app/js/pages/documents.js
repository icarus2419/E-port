import { icon } from '../icons.js';
import { escapeHtml, fmtDate, fmtBytes, initials, empty } from '../utils.js';
import { state } from '../state.js';
import { visibleDocuments, selectedFrom, canSubmit, canReview } from '../helpers.js';
import { sectionTitle } from './shell.js';
import { STATUS_ORDER, STATUS_NAMES } from '../constants.js';

function urgencyChip(doc) {
  if (!doc.dueDate) return '';
  const diffMs = new Date(doc.dueDate) - Date.now();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0)  return `<span class="urgency-chip overdue">${icon('alert-triangle')}Overdue</span>`;
  if (diffDays === 0) return `<span class="urgency-chip due-today">${icon('bell')}Due today</span>`;
  if (diffDays <= 3) return `<span class="urgency-chip due-soon">${icon('clock')}Due in ${diffDays}d</span>`;
  return '';
}

function fileKind(mimeType = '') {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word')) return 'doc';
  if (mimeType.includes('image')) return 'img';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xls';
  return 'file';
}

function fileExt(mimeType = '') {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'DOC';
  if (mimeType.includes('image')) return 'IMG';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS';
  return 'FILE';
}

export function documentCard(doc, selected) {
  const isDemoRecord = !doc.storageName;
  return `
    <button class="doc-card ${selected ? 'selected' : ''}" data-select-doc="${doc.id}" type="button" aria-pressed="${selected ? 'true' : 'false'}">
      <div class="doc-header">
        <div>
          <h3 class="doc-title">${escapeHtml(doc.title)}</h3>
          <div class="doc-meta">
            <span class="status-pill ${doc.status}">${escapeHtml(doc.statusLabel)}</span>
            <span class="small-pill">v${escapeHtml(doc.version)}</span>
            <span class="small-pill">${escapeHtml(doc.confidentiality)}</span>
            ${isDemoRecord ? '<span class="small-pill demo-badge">Demo record</span>' : ''}
            ${urgencyChip(doc)}
          </div>
        </div>
        <span class="file-badge ${fileKind(doc.mimeType)}">${fileExt(doc.mimeType)}</span>
      </div>
      <p class="doc-description">${escapeHtml(doc.notes || doc.rejectionReason || 'No notes added yet.')}</p>
      <div class="doc-footer">
        <span>${escapeHtml(doc.category)} · ${escapeHtml(doc.department)}</span>
        <span>Due ${escapeHtml(doc.dueDate || 'not set')}</span>
      </div>
    </button>
  `;
}

function approvalReceipt(doc) {
  const receipt = doc.approvalReceipt || {};
  return `
    <div class="receipt">
      <div class="receipt-head">
        ${icon('badge-check')}
        <span>Approval receipt</span>
        <span class="verified-tag">${icon('check')}Hash locked</span>
      </div>
      <div class="receipt-grid">
        <div><span>Receipt</span><strong>${escapeHtml(receipt.id || 'receipt pending')}</strong></div>
        <div><span>Approved</span><strong>${fmtDate(receipt.approvedAt || doc.approvedAt)}</strong></div>
        <div><span>Approver</span><strong>${escapeHtml(receipt.approver?.name || doc.reviewer?.name || 'Reviewer')}</strong></div>
        <div><span>Version</span><strong>v${escapeHtml(receipt.version || doc.version)}</strong></div>
      </div>
      <div class="hash-box">Approved SHA-256: ${escapeHtml(receipt.hash || doc.hash)}</div>
      <p class="receipt-copy">This receipt records the exact document version and fingerprint that was approved. It is not an e-signature.</p>
    </div>
  `;
}

function integrityEvidence(doc) {
  const integrity = doc.integrity || {};
  const verified = Boolean(integrity.verified);
  const tone = verified ? 'green' : integrity.status === 'demo_record' ? 'amber' : 'red';
  const label = verified ? 'Verified' : integrity.status === 'demo_record' ? 'Demo record' : 'Needs attention';
  return `
    <div class="receipt integrity ${tone}">
      <div class="receipt-head">
        ${icon(verified ? 'check-circle' : 'hash')}
        <span>Document fingerprint</span>
        <span class="verified-tag ${tone}">${verified ? icon('check') : icon('alert-triangle')}${label}</span>
      </div>
      <div class="hash-box">SHA-256: ${escapeHtml(doc.hash)}</div>
      <div class="receipt-foot">
        <p>${escapeHtml(integrity.message || 'Fingerprint is recorded for this document version.')}</p>
        <button class="btn ghost small" data-copy-hash="${escapeHtml(doc.hash)}">${icon('copy')}Copy fingerprint</button>
      </div>
    </div>
  `;
}

function versionHistory(doc) {
  const versions = doc.versions || [];
  if (!versions.length) return '';
  return `
    <div class="version-card">
      <div class="receipt-head">${icon('layers')}<span>Version history</span><span class="small-pill">${versions.length} prior</span></div>
      ${versions.slice().reverse().map((version) => `
        <div class="version-row">
          <strong>v${escapeHtml(version.version)}</strong>
          <span>${escapeHtml(version.fileName || 'Document file')}</span>
          <code>${escapeHtml(String(version.hash || '').slice(0, 16))}...</code>
        </div>
      `).join('')}
    </div>
  `;
}

function revisionForm(doc) {
  if (!canSubmit(doc) || doc.status === 'approved') return '';
  return `
    <form class="version-form" data-version-form="${doc.id}">
      <div>
        <strong>${icon('layers')}Upload revised version</strong>
        <p>Use this after reviewer feedback. The app preserves the prior hash and assigns the next version number.</p>
      </div>
      <div class="field">
        <label>Revised file</label>
        <input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt" required />
      </div>
      <div class="field">
        <label>Revision notes</label>
        <textarea name="notes" placeholder="Summarize what changed in this version..."></textarea>
      </div>
      <div class="btn-row">
        <label class="toggle-row"><input type="checkbox" name="submitNow" value="true" /> Submit revised version immediately</label>
        <button class="btn ghost small" type="submit">${icon('upload')}Upload version</button>
      </div>
    </form>
  `;
}

export function documentDetail(doc) {
  const reviewerActions = canReview(doc) ? `
    <div class="sticky-actions">
      <div class="action-bar">
        <button class="btn green small" data-decision="approve" data-doc="${doc.id}">${icon('check')}Approve</button>
        <button class="btn amber small" data-decision="changes" data-doc="${doc.id}">${icon('alert-triangle')}Changes</button>
        <button class="btn red small" data-decision="reject" data-doc="${doc.id}">${icon('x-circle')}Reject</button>
      </div>
    </div>
  ` : '';

  return `
    <div class="detail-head">
      <div>
        <h3>${escapeHtml(doc.title)}</h3>
        <p>${escapeHtml(doc.fileName || 'No file')} · ${fmtBytes(doc.fileSize)}</p>
      </div>
      <span class="status-pill ${doc.status}">${escapeHtml(doc.statusLabel)}</span>
    </div>

    <div class="detail-section">
      <div class="detail-section-label">Overview</div>
      <div class="kv-grid">
        <div class="kv"><div class="k">Owner</div><div class="v">${escapeHtml(doc.owner?.name || 'Unknown')}</div></div>
        <div class="kv"><div class="k">Reviewer</div><div class="v">${escapeHtml(doc.reviewer?.name || 'Unassigned')}</div></div>
        <div class="kv"><div class="k">Category</div><div class="v">${escapeHtml(doc.category)}</div></div>
        <div class="kv"><div class="k">Due date</div><div class="v">${escapeHtml(doc.dueDate || 'Not set')}</div></div>
      </div>
    </div>

    ${doc.status === 'approved' ? `
      <div class="detail-section">
        <div class="detail-section-label">Approval status</div>
        ${approvalReceipt(doc)}
      </div>
    ` : ''}

    <div class="detail-section">
      <div class="detail-section-label">File fingerprint</div>
      ${integrityEvidence(doc)}
    </div>

    ${versionHistory(doc) ? `
      <div class="detail-section">
        <div class="detail-section-label">Version history · v${escapeHtml(doc.version)}</div>
        ${versionHistory(doc)}
      </div>
    ` : ''}

    ${doc.rejectionReason ? `
      <div class="note-box">
        <strong>${icon('alert-triangle')}Reviewer note</strong>
        <p>${escapeHtml(doc.rejectionReason)}</p>
      </div>
    ` : ''}

    ${reviewerActions}

    ${canSubmit(doc) ? `
      <div class="action-bar">
        <button class="btn primary small" data-submit-doc="${doc.id}">${icon('arrow-right')}Submit for approval</button>
        <button class="btn ghost small" data-download-doc="${doc.id}">${icon('download')}Download</button>
      </div>
    ` : canReview(doc) ? '' : `
      <div class="action-bar">
        <button class="btn ghost small" data-download-doc="${doc.id}">${icon('download')}Download</button>
      </div>
    `}

    ${revisionForm(doc)}

    <div class="detail-section">
      <div class="detail-section-label">Comments</div>
      <form class="form-stack comment-form" data-comment-form="${doc.id}" style="margin-bottom:12px">
        <div class="field">
          <textarea name="body" placeholder="Add a reviewer note, owner reply, or admin observation..."></textarea>
        </div>
        <button class="btn ghost small align-start" type="submit">${icon('message-square')}Add comment</button>
      </form>
      <div class="comment-list">
        ${(doc.comments || []).length ? doc.comments.map((comment) => `
          <div class="comment">
            <div class="c-head">
              <span class="c-avatar">${initials(comment.user)}</span>
              <strong>${escapeHtml(comment.user?.name || 'Unknown user')}</strong>
              <span class="c-time">${fmtDate(comment.createdAt)}</span>
            </div>
            <p>${escapeHtml(comment.body)}</p>
          </div>
        `).join('') : empty('No comments yet.')}
      </div>
    </div>
  `;
}

export function documentsPage() {
  const docs = visibleDocuments();
  const doc = selectedFrom(docs);
  return `
    ${sectionTitle('Document control room', 'Search, filter, inspect, submit, approve, reject and comment without leaving the review workspace.', `<button class="btn primary" data-route="upload">${icon('plus')}New upload</button>`)}
    <div class="toolbar">
      <div class="search-wrap">
        ${icon('search')}
        <input class="search-input" id="searchInput" value="${escapeHtml(state.search)}" placeholder="Search title, category, owner, reviewer..." />
      </div>
      <div class="segmented">
        ${['all', ...STATUS_ORDER].map((status) => `<button class="${state.status === status ? 'active' : ''}" data-filter-status="${status}">${STATUS_NAMES[status]}</button>`).join('')}
      </div>
      <span class="badge">${docs.length} shown</span>
    </div>
    <div class="detail-layout">
      <div class="doc-grid">
        ${docs.length ? docs.map((item) => documentCard(item, doc?.id === item.id)).join('') : empty('No documents match this filter.')}
      </div>
      <aside class="panel detail-panel">
        ${doc ? documentDetail(doc) : empty('Select a document to inspect its approval evidence.')}
      </aside>
    </div>
  `;
}

export function submissionsPage() {
  const docs = visibleDocuments().filter((doc) => doc.ownerId === state.user?.id || state.user?.role === 'admin');
  const doc = selectedFrom(docs);
  return `
    ${sectionTitle('My submissions', 'Track documents you own, upload revised versions after change requests, and confirm approval receipts.', `<button class="btn primary" data-route="upload">${icon('plus')}New submission</button>`)}
    <div class="toolbar">
      <div class="search-wrap">
        ${icon('search')}
        <input class="search-input" id="searchInput" value="${escapeHtml(state.search)}" placeholder="Search my submissions..." />
      </div>
      <div class="segmented">
        ${['all', ...STATUS_ORDER].map((status) => `<button class="${state.status === status ? 'active' : ''}" data-filter-status="${status}">${STATUS_NAMES[status]}</button>`).join('')}
      </div>
      <span class="badge">${docs.length} owned</span>
    </div>
    <div class="detail-layout">
      <div class="doc-grid">
        ${docs.length ? docs.map((item) => documentCard(item, doc?.id === item.id)).join('') : empty('No submissions match this view. Upload a document to start an approval cycle.')}
      </div>
      <aside class="panel detail-panel">
        ${doc ? documentDetail(doc) : empty('Select a submission to inspect status, comments, fingerprint and receipt details.')}
      </aside>
    </div>
  `;
}
