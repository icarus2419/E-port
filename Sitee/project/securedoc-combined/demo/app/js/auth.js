import { state } from './state.js';
import { api } from './api.js';
import { toast } from './utils.js';
import { render } from './render.js';

export async function loadData() {
  if (!state.token) {
    state.loading = false;
    render();
    return;
  }

  try {
    state.loading = true;
    render();
    const [me, docs, audit, stats, reviewers] = await Promise.all([
      api('/api/auth/me'),
      api('/api/documents'),
      api('/api/audit'),
      api('/api/stats'),
      api('/api/users/reviewers')
    ]);
    state.user = me.user;
    state.session = me.session || null;
    state.documents = docs.documents || [];
    state.audit = audit.audit || [];
    state.stats = stats;
    state.reviewers = reviewers.reviewers || [];
    if (!state.selectedDocumentId && state.documents[0]) state.selectedDocumentId = state.documents[0].id;
  } catch (error) {
    localStorage.removeItem('sda_token');
    state.token = '';
    state.user = null;
    state.session = null;
    toast(error.message, 'error');
  } finally {
    state.loading = false;
    render();
  }
}

export async function login(email, password) {
  try {
    const payload = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    state.token = payload.token;
    state.user = payload.user;
    state.session = payload.session || null;
    localStorage.setItem('sda_token', state.token);
    toast(`Logged in as ${payload.user.roleName}.`);
    await loadData();
  } catch (error) {
    toast(error.message, 'error');
  }
}

export async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch (_error) {
    // Clear local token even if server session has already expired.
  }
  localStorage.removeItem('sda_token');
  state.token = '';
  state.user = null;
  state.session = null;
  state.documents = [];
  state.audit = [];
  state.stats = null;
  state.route = 'dashboard';
  render();
}

export async function refresh(message) {
  await loadData();
  if (message) toast(message);
}
