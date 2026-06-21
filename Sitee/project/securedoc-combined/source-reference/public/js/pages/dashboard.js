import { icon } from '../icons.js';
import { escapeHtml, fmtDate, empty } from '../utils.js';
import { state } from '../state.js';
import { countStatus } from '../helpers.js';
import { sectionTitle } from './shell.js';
import { auditRowTimeline } from './audit.js';
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

function statCard(ic, color, label, value, text) {
  return `
    <div class="stat-card">
      <div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon(ic)}</span></div>
      <div class="stat-value">${escapeHtml(value)}</div>
      <p class="stat-text">${text}</p>
    </div>
  `;
}

function pipelineCopy(status) {
  return {
    draft: 'Saved but not submitted',
    pending: 'Awaiting decision',
    changes_requested: 'Needs revision',
    approved: 'Receipt created',
    rejected: 'Closed as rejected'
  }[status] || 'Tracked';
}

export function dashboardPage() {
  const stats = state.stats || {};
  const pending = state.documents.filter((doc) => doc.status === 'pending' && (state.user?.role === 'admin' || doc.assignedTo === state.user?.id)).slice(0, 5);
  const recent = state.audit.slice(0, 6);
  const max = Math.max(1, ...STATUS_ORDER.map(countStatus));
  const mySubmissions = state.documents.filter((doc) => doc.ownerId === state.user?.id).slice(0, 4);
  const pendingCount = pending.length;
  const overdueCount = state.documents.filter((doc) => {
    if (!doc.dueDate || doc.status === 'approved' || doc.status === 'rejected') return false;
    return new Date(doc.dueDate) < Date.now();
  }).length;

  const pendingPanel = (state.user?.role === 'submitter')
    ? `
      <div class="panel">
        <div class="panel-title"><div><h3>My recent submissions</h3><p>Documents you own and their current approval status.</p></div><button class="btn small ghost" data-route="submissions">View all</button></div>
        <div class="queue-list">
          ${mySubmissions.length
            ? mySubmissions.map((doc) => `
              <button class="queue-card" data-open-doc="${doc.id}">
                <div class="queue-card-inner">
                  <div>
                    <strong>${escapeHtml(doc.title)}</strong>
                    <p>${escapeHtml(doc.category)} · v${doc.version} · due ${escapeHtml(doc.dueDate || 'not set')}</p>
                  </div>
                  <span class="status-pill ${doc.status}">${escapeHtml(doc.statusLabel)}</span>
                </div>
              </button>
            `).join('')
            : empty('No submissions yet.', 'Nothing submitted')}
        </div>
      </div>
    `
    : `
      <div class="panel">
        <div class="panel-title"><div><h3>Needs my review</h3><p>Pending submissions assigned to you that require a decision.</p></div><button class="btn small ghost" data-route="review">Review queue</button></div>
        <div class="queue-list">
          ${pending.length
            ? pending.map((doc) => `
              <button class="queue-card" data-open-doc="${doc.id}">
                <div class="queue-card-inner">
                  <div>
                    <strong>${escapeHtml(doc.title)}</strong>
                    <p>${escapeHtml(doc.category)} · submitted by ${escapeHtml(doc.owner?.name || 'Unknown')} · due ${escapeHtml(doc.dueDate || 'not set')}</p>
                  </div>
                  <span class="status-pill pending">Pending</span>
                </div>
              </button>
            `).join('')
            : empty('All caught up.', 'No pending items')}
        </div>
      </div>
    `;

  const attentionItems = [
    pendingCount > 0 ? `${pendingCount} document${pendingCount === 1 ? '' : 's'} awaiting review` : null,
    overdueCount > 0 ? `${overdueCount} overdue` : null
  ].filter(Boolean);

  const attentionCard = (state.user?.role !== 'submitter') ? (attentionItems.length > 0 ? `
    <div class="attention-card">
      <div class="attention-card-body">
        <h3>Needs your attention</h3>
        <p>${escapeHtml(attentionItems.join(' · '))}</p>
      </div>
      <button class="btn primary" data-route="review">${icon('check')}Open review queue</button>
    </div>
  ` : `
    <div class="attention-card quiet">
      <div class="attention-card-body">
        <h3>All clear</h3>
        <p>No documents pending your review right now.</p>
      </div>
    </div>
  `) : (mySubmissions.some((d) => d.status === 'changes_requested') ? `
    <div class="attention-card">
      <div class="attention-card-body">
        <h3>Needs your attention</h3>
        <p>A reviewer has requested changes on one of your documents.</p>
      </div>
      <button class="btn amber" data-route="submissions">${icon('file-text')}View submissions</button>
    </div>
  ` : '');

  return `
    ${sectionTitle('Dashboard', `Welcome back, ${escapeHtml(state.user?.name?.split(' ')[0] || 'there')}. Here's a live view of your approval workspace.`, state.user?.role !== 'reviewer' ? `<button class="btn primary" data-route="upload">${icon('plus')}Upload document</button>` : '')}
    ${attentionCard}
    <div class="grid four">
      ${statCard('folder', 'blue', 'Visible documents', stats.total ?? 0, 'Documents your role has permission to access')}
      ${statCard('inbox', 'amber', 'Needs review', stats.pendingForMe ?? 0, state.user?.role === 'submitter' ? 'Awaiting a reviewer decision' : 'Pending items assigned to you')}
      ${statCard('check-circle', 'green', 'Approved', stats.approved ?? 0, 'Documents with a locked approval receipt')}
      ${statCard('hash', 'cyan', 'File integrity', stats.verifiedFiles ?? 0, 'Uploaded files whose bytes match their stored hash')}
    </div>

    <div class="grid dashboard dashboard-grid">
      <div class="grid">
        <div class="panel">
          <div class="panel-title"><div><h3>Approval pipeline</h3><p>Status distribution across all documents you can access.</p></div></div>
          <div class="pipeline">
            ${STATUS_ORDER.map((status) => `
              <div class="stage" style="--fill:${Math.max(0.08, countStatus(status) / max)}">
                <span>${STATUS_NAMES[status]}</span>
                <strong>${countStatus(status)}</strong>
                <p>${pipelineCopy(status)}</p>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="panel">
          <div class="panel-title"><div><h3>Recent audit activity</h3><p>Every workflow action is recorded with actor, role and timestamp.</p></div><button class="btn small ghost" data-route="audit">View all</button></div>
          <div class="timeline">
            ${recent.length ? recent.map(auditRowTimeline).join('') : empty('No audit events yet.', 'Audit trail empty')}
          </div>
        </div>
      </div>

      <div class="grid">
        ${pendingPanel}
        <div class="panel">
          <div class="panel-title"><div><h3>System status</h3><p>Live workspace indicators for this session.</p></div></div>
          <div class="system-status-grid">
            <div class="ss-item">
              <span class="ss-dot green"></span>
              <div><strong>Workspace online</strong><p>API and session active</p></div>
            </div>
            <div class="ss-item">
              <span class="ss-dot green"></span>
              <div><strong>Audit trail active</strong><p>${state.audit.length} events recorded</p></div>
            </div>
            <div class="ss-item">
              <span class="ss-dot ${stats.changesRequested ? 'amber' : 'green'}"></span>
              <div><strong>Changes requested</strong><p>${stats.changesRequested ?? 0} document${stats.changesRequested === 1 ? '' : 's'} need revision</p></div>
            </div>
            <div class="ss-item">
              <span class="ss-dot blue"></span>
              <div><strong>Session expires</strong><p>${state.session?.expiresAt ? fmtDate(state.session.expiresAt, 'short') : 'Active session'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
