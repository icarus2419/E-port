import { icon } from '../icons.js';
import { escapeHtml, fmtDate, empty } from '../utils.js';
import { state } from '../state.js';
import { ACTION_LABELS } from '../constants.js';
import { sectionTitle } from './shell.js';

export function actionLabel(action) {
  return ACTION_LABELS[action] || String(action || 'event').split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function auditIcon(action) {
  if (action.includes('approve')) return { icon: 'check-circle', tone: 'green' };
  if (action.includes('reject')) return { icon: 'x-circle', tone: 'red' };
  if (action.includes('changes')) return { icon: 'alert-triangle', tone: 'amber' };
  if (action.includes('permission') || action.includes('failed')) return { icon: 'alert-triangle', tone: 'red' };
  if (action.includes('upload')) return { icon: 'upload', tone: 'blue' };
  if (action.includes('login')) return { icon: 'lock', tone: 'blue' };
  if (action.includes('comment')) return { icon: 'message-square', tone: 'blue' };
  if (action.includes('download')) return { icon: 'download', tone: 'blue' };
  return { icon: 'file', tone: 'blue' };
}

function uniqueOptions(values) {
  const map = new Map();
  values.forEach((value) => {
    if (Array.isArray(value)) {
      if (value[0]) map.set(value[0], value[1]);
    } else if (value) {
      map.set(value, value);
    }
  });
  return [...map.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1])));
}

function filterSelect(key, label, options, formatter = (value) => value) {
  return `
    <label class="filter-field">
      <span>${label}</span>
      <select data-audit-filter="${key}">
        <option value="all">All</option>
        ${options.map(([value, text]) => `<option value="${escapeHtml(value)}" ${state.auditFilters[key] === value ? 'selected' : ''}>${escapeHtml(formatter(text))}</option>`).join('')}
      </select>
    </label>
  `;
}

function filteredAuditEvents() {
  return state.audit.filter((event) => {
    const filters = state.auditFilters;
    if (filters.action !== 'all' && event.action !== filters.action) return false;
    if (filters.user !== 'all' && event.actorId !== filters.user) return false;
    if (filters.document !== 'all' && event.documentId !== filters.document) return false;
    if (filters.status !== 'all' && (event.status || 'success') !== filters.status) return false;
    return true;
  });
}

function auditRow(event) {
  const { icon: ic, tone } = auditIcon(event.action);
  return `
    <div class="audit-row">
      <div class="audit-row-action">
        <span class="atd ${tone}">${icon(ic)}</span>
        ${escapeHtml(actionLabel(event.action))}
      </div>
      <div class="audit-row-actor">${escapeHtml(event.actor?.name || 'System')}</div>
      <div class="audit-row-doc">${event.document ? escapeHtml(event.document.title) : '—'}</div>
      <div class="audit-row-time">${fmtDate(event.createdAt)}</div>
      <div class="audit-row-status"><span class="status-pill ${event.status === 'failure' ? 'rejected' : 'approved'}">${escapeHtml(event.status || 'success')}</span></div>
      ${event.eventHash ? `<div class="audit-hash-row">chain: ${escapeHtml(event.eventHash.slice(0, 32))}…</div>` : ''}
    </div>
  `;
}

export function auditRowTimeline(event) {
  const { icon: ic, tone } = auditIcon(event.action);
  return `
    <div class="timeline-card">
      <div class="timeline-dot ${tone}">${icon(ic)}</div>
      <div class="timeline-body">
        <strong>${escapeHtml(actionLabel(event.action))}</strong>
        <p>${escapeHtml(event.details || 'No details recorded.')}</p>
        <span class="meta">${fmtDate(event.createdAt)} · ${escapeHtml(event.actor?.name || 'System')}</span>
        ${event.eventHash ? `<code class="audit-hash">chain ${escapeHtml(event.eventHash.slice(0, 18))}...</code>` : ''}
      </div>
    </div>
  `;
}

export function auditPage() {
  const events = filteredAuditEvents();
  const actions = uniqueOptions(state.audit.map((event) => event.action));
  const users = uniqueOptions(state.audit.map((event) => event.actor).filter(Boolean).map((user) => [user.id, user.name]));
  const documents = uniqueOptions(state.audit.map((event) => event.document).filter(Boolean).map((doc) => [doc.id, doc.title]));
  const hasActiveFilters = Object.values(state.auditFilters).some((v) => v !== 'all');
  return `
    ${sectionTitle('Audit trail', 'Tamper-evident event history. Each entry records the actor, role, action, document and a hash linking it to the prior event.')}
    <div class="panel">
      <div class="audit-filters-row">
        <div class="audit-filters">
          ${filterSelect('action', 'Action', actions, actionLabel)}
          ${filterSelect('user', 'Actor', users)}
          ${filterSelect('document', 'Document', documents)}
          ${filterSelect('status', 'Status', uniqueOptions(state.audit.map((event) => event.status || 'success')))}
        </div>
        ${hasActiveFilters ? `<button class="btn ghost small audit-clear-btn" id="clearAuditFilters">${icon('x-circle')}Clear filters</button>` : ''}
      </div>
      <div class="audit-count">${events.length} event${events.length === 1 ? '' : 's'}${hasActiveFilters ? ' matching filters' : ' total'}</div>
      ${events.length ? `
        <div class="audit-table">
          <div class="audit-row-head">
            <span>Action</span><span>Actor</span><span>Document</span><span>Time</span><span>Status</span>
          </div>
          ${events.map(auditRow).join('')}
        </div>
      ` : empty(hasActiveFilters ? 'No events match the current filters. Try clearing them.' : 'No audit events recorded yet.', hasActiveFilters ? 'No results' : 'Audit trail empty')}
    </div>
  `;
}
