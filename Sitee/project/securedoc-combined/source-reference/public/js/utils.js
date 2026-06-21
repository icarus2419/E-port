import { icon } from './icons.js';

const toastHost = document.querySelector('#toastHost');

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function fmtDate(value, style = 'medium') {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: style === 'short' ? 'medium' : 'medium',
    timeStyle: value.includes('T') ? 'short' : undefined
  }).format(date);
}

export function fmtBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function initials(user) {
  return escapeHtml(user?.avatar || String(user?.name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase());
}

export function toast(message, type = 'success') {
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  toastHost.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

export function empty(message, title = '') {
  return `
    <div class="empty-card">
      ${icon('inbox')}
      ${title ? `<strong>${escapeHtml(title)}</strong>` : ''}
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}
