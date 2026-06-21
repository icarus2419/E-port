import { icon } from '../icons.js';
import { escapeHtml, fmtDate, initials } from '../utils.js';
import { state } from '../state.js';
import { navItemsForRole } from '../helpers.js';

export function shell(content) {
  return `
    <div class="sidebar-backdrop ${state.mobileNavOpen ? 'open' : ''}" id="sidebarBackdrop"></div>
    <div class="app-shell">
      ${sidebar()}
      <section class="main-area">
        ${topbar()}
        <div class="page">${content}</div>
      </section>
    </div>
    ${state.decisionModal ? decisionModal() : ''}
  `;
}

function sidebar() {
  const role = state.user?.role || 'submitter';
  const counts = {
    review: state.documents.filter((d) => d.status === 'pending' && (state.user?.role === 'admin' || d.assignedTo === state.user?.id)).length,
    submissions: state.documents.filter((d) => d.ownerId === state.user?.id).length
  };
  return `
    <aside class="sidebar ${state.mobileNavOpen ? 'open' : ''}" id="sidebar">
      <a class="sidebar-brand" href="/" aria-label="Back to SecureDoc home">
        <div class="logo-mark">${icon('shield')}</div>
        <div>
          <h1>SecureDoc</h1>
          <p>Approval platform</p>
        </div>
      </a>
      <div class="nav-section">Workspace</div>
      <nav class="nav-list">
        ${navItemsForRole(role).map(([route, ic, label]) => `
          <button class="nav-button ${state.route === route ? 'active' : ''}" data-route="${route}">
            ${icon(ic)}<span>${label}</span>
            ${route === 'review' && counts.review ? `<span class="nav-badge">${counts.review}</span>` : ''}
            ${route === 'submissions' && counts.submissions ? `<span class="nav-badge">${counts.submissions}</span>` : ''}
          </button>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="sf-row">${icon('hash')}Security evidence</div>
        <p>Expiring sessions, controlled uploads, SHA-256 fingerprints, approval receipts and hash-chained audit events.</p>
      </div>
    </aside>
  `;
}

function topbar() {
  const role = state.user?.roleName || 'Demo user';
  const sessionCopy = state.session?.expiresAt ? `Session expires ${fmtDate(state.session.expiresAt, 'short')}` : 'Demo session';
  return `
    <header class="topbar">
      <button class="btn ghost mobile-nav-toggle" id="mobileNavToggle">${icon('menu')}Menu</button>
      <div class="system-pill"><span></span> secure workspace online</div>
      <div class="spacer"></div>
      <div class="user-chip">
        <div class="avatar">${initials(state.user)}</div>
        <div class="uc-body">
          <strong>${escapeHtml(state.user?.name || '')}</strong>
          <span>${escapeHtml(role)} · ${escapeHtml(sessionCopy)}</span>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn ghost small" id="refreshBtn">${icon('refresh')}Refresh</button>
        <button class="btn small" id="logoutBtn">${icon('log-out')}Log out</button>
      </div>
    </header>
  `;
}

export function sectionTitle(title, body, action = '') {
  return `
    <div class="section-title">
      <div>
        <span class="eyebrow">${icon('shield')}${escapeHtml(state.user?.roleName || 'Secure workflow')}</span>
        <h2>${title}</h2>
        <p>${body}</p>
      </div>
      ${action}
    </div>
  `;
}

function decisionModal() {
  const doc = state.documents.find((item) => item.id === state.decisionModal.docId);
  const decision = state.decisionModal.decision;
  const copy = {
    approve: {
      title: 'Confirm approval',
      body: 'Review the document details below before approving. An approval receipt will be generated and tied to this exact file version and hash. This action is recorded in the audit trail and cannot be undone.',
      btn: 'Approve document',
      color: 'green',
      icon: 'check-circle'
    },
    reject: {
      title: 'Reject document',
      body: 'Provide a clear reason so the submitter understands exactly what prevented approval.',
      btn: 'Reject document',
      color: 'red',
      icon: 'x-circle'
    },
    changes: {
      title: 'Request changes',
      body: 'Describe what needs to be corrected or clarified before this document can be resubmitted.',
      btn: 'Send change request',
      color: 'amber',
      icon: 'alert-triangle'
    }
  }[decision];

  if (!doc || !copy) return '';
  return `
    <div class="modal-backdrop" id="modalBackdrop">
      <form class="modal-card" id="decisionForm">
        <div class="modal-ic ${copy.color}">${icon(copy.icon)}</div>
        <h3>${copy.title}</h3>
        <p>${copy.body}</p>
        <div class="decision-summary">
          <div><span>Document</span><strong>${escapeHtml(doc.title)}</strong></div>
          <div><span>Submitter</span><strong>${escapeHtml(doc.owner?.name || 'Unknown')}</strong></div>
          <div><span>Version</span><strong>v${escapeHtml(doc.version)}</strong></div>
          <div><span>Submitted</span><strong>${fmtDate(doc.submittedAt)}</strong></div>
          <div class="wide"><span>SHA-256 Fingerprint — this hash will be locked to the approval receipt</span><code>${escapeHtml(doc.hash)}</code></div>
        </div>
        ${decision === 'approve' ? `
          <div class="review-checklist">
            <div class="review-checklist-title">Pre-approval checklist</div>
            <div class="review-checklist-item">${icon('check')} Document title and category confirmed</div>
            <div class="review-checklist-item">${icon('check')} SHA-256 fingerprint visible above</div>
            <div class="review-checklist-item">${icon('check')} Version v${escapeHtml(doc.version)} confirmed</div>
            <div class="review-checklist-item">${icon('check')} Submitter identity verified</div>
          </div>
        ` : ''}
        <div class="field">
          <label>${decision === 'approve' ? 'Approval note (optional)' : 'Reviewer note (required)'}</label>
          <textarea name="note" ${decision === 'approve' ? '' : 'required'} placeholder="${decision === 'approve' ? 'Optional note for the record...' : decision === 'reject' ? 'Explain clearly why this document is rejected...' : 'Describe what needs to be changed before resubmission...'}"></textarea>
        </div>
        ${decision === 'approve' ? `
        <label class="toggle-row" style="margin-bottom: 4px;">
          <input type="checkbox" id="approveConfirm" required />
          I confirm I have reviewed this document and its fingerprint, and I authorise this approval.
        </label>
        ` : ''}
        <div class="btn-row end">
          <button class="btn ghost" type="button" id="closeModalBtn">Cancel</button>
          <button class="btn ${copy.color}" type="submit">${copy.btn}</button>
        </div>
      </form>
    </div>
  `;
}
