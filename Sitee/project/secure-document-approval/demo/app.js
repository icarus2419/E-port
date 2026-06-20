const app = document.querySelector('#app');
const toastHost = document.querySelector('#toastHost');

const state = {
  token: localStorage.getItem('sda_token') || '',
  user: null,
  documents: [],
  audit: [],
  reviewers: [],
  stats: null,
  session: null,
  route: localStorage.getItem('sda_route') || 'dashboard',
  search: '',
  status: 'all',
  auditFilters: {
    action: 'all',
    user: 'all',
    document: 'all',
    status: 'all'
  },
  selectedDocumentId: null,
  loading: true,
  mobileNavOpen: false,
  decisionModal: null
};

let focusAfterRender = null;
let scrollTopAfterRender = false;
let _heroScrollHandler = null;

const statusOrder = ['draft', 'pending', 'changes_requested', 'approved', 'rejected'];

const ACTION_LABELS = {
  login: 'Login',
  logout: 'Logout',
  upload: 'Document Uploaded',
  submit: 'Submitted for Review',
  uploaded_and_submitted: 'Uploaded & Submitted',
  submitted_document: 'Submitted for Review',
  approve: 'Document Approved',
  approved_document: 'Document Approved',
  reject: 'Document Rejected',
  rejected_document: 'Document Rejected',
  request_changes: 'Changes Requested',
  requested_changes: 'Changes Requested',
  comment: 'Comment Added',
  commented: 'Comment Added',
  download: 'Document Downloaded',
  version_upload: 'New Version Uploaded',
  assign_reviewer: 'Reviewer Assigned',
  failed_login: 'Failed Login Attempt',
  failed_permission: 'Access Denied'
};
const statusNames = {
  all: 'All',
  draft: 'Draft',
  pending: 'Pending Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  rejected: 'Rejected'
};

const ALL_NAV = [
  ['dashboard',   'grid',      'Dashboard'],
  ['documents',   'folder',    'Documents'],
  ['submissions', 'file-text', 'My Submissions'],
  ['upload',      'upload',    'Upload'],
  ['review',      'check',     'Needs Review'],
  ['audit',       'clock',     'Audit Trail'],
  ['security',    'shield',    'Security']
];

function navItemsForRole(role) {
  const keys = {
    submitter: ['dashboard', 'submissions', 'upload', 'documents', 'security'],
    reviewer:  ['dashboard', 'review', 'documents', 'audit', 'security'],
    admin:     ALL_NAV.map(([r]) => r)
  }[role] || ALL_NAV.map(([r]) => r);
  return ALL_NAV.filter(([r]) => keys.includes(r));
}

const demoAccounts = [
  {
    label: 'Joseph Doyle-Samadi',
    role: 'Employee / Submitter',
    email: 'employee@demo.com',
    password: 'demo123',
    color: 'blue',
    icon: 'briefcase',
    description: 'Upload files, save drafts, submit documents and reply to change requests.'
  },
  {
    label: 'Maya Chen',
    role: 'Reviewer / Manager',
    email: 'reviewer@demo.com',
    password: 'demo123',
    color: 'violet',
    icon: 'check-circle',
    description: 'Open the approval queue, approve, reject, or request changes with notes.'
  },
  {
    label: 'Alex Morgan',
    role: 'System Admin',
    email: 'admin@demo.com',
    password: 'demo123',
    color: 'amber',
    icon: 'shield',
    description: 'See every document, audit event, reviewer assignment and security control.'
  }
];

/* ============================================================
   Icon system (inline SVG, no external deps)
   ============================================================ */
const ICONS = {
  shield: '<path d="M12 3l8 3v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  upload: '<path d="M12 19V6"/><path d="M6 12l6-6 6 6"/><path d="M4 21h16"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="8" r="2.5"/><path d="M21 20c0-2.3-1.6-4-4-4.6"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  bell: '<path d="M7 9a5 5 0 0 1 10 0c0 5 2 6 2 6H5s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v6h-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  download: '<path d="M12 4v12"/><path d="M6 12l6 6 6-6"/><path d="M4 20h16"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
  'alert-triangle': '<path d="M12 3l10 18H2z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  'message-square': '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  file: '<path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M14 2v6h6"/>',
  'file-text': '<path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M14 2v6h6"/><path d="M9 14h6M9 17h4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  'badge-check': '<path d="M12 3l2.3 1.3 2.6-.2 1.2 2.3 2.3 1.2-.2 2.6L21.5 12l-1.3 2.3.2 2.6-2.3 1.2-1.2 2.3-2.6-.2L12 21.5l-2.3-1.3-2.6.2-1.2-2.3-2.3-1.2.2-2.6L2.5 12l1.3-2.3-.2-2.6 2.3-1.2 1.2-2.3 2.6.2z"/><path d="M9 12l2 2 4-4"/>',
  layers: '<path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  inbox: '<path d="M4 12h4l2 3h4l2-3h4"/><path d="M5.5 5h13l2.5 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>'
};
function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24">${ICONS[name] || ICONS.file}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtDate(value, style = 'medium') {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: style === 'short' ? 'medium' : 'medium',
    timeStyle: value.includes('T') ? 'short' : undefined
  }).format(date);
}

function fmtBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function initials(user) {
  return escapeHtml(user?.avatar || String(user?.name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase());
}

function toast(message, type = 'success') {
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  toastHost.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (!(options.body instanceof FormData) && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' ? payload.error : payload;
    throw new Error(message || 'Something went wrong.');
  }

  return payload;
}

async function loadData() {
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

function setRoute(route) {
  state.route = route;
  state.mobileNavOpen = false;
  scrollTopAfterRender = true;
  localStorage.setItem('sda_route', route);
  render();
}

async function login(email, password) {
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

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch (_error) {
    // The local token should still be cleared even if the server session has already expired.
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

async function refresh(message) {
  await loadData();
  if (message) toast(message);
}

function visibleDocuments() {
  return state.documents.filter((doc) => {
    const haystack = `${doc.title} ${doc.category} ${doc.department} ${doc.owner?.name || ''} ${doc.reviewer?.name || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(state.search.trim().toLowerCase());
    const matchesStatus = state.status === 'all' || doc.status === state.status;
    return matchesSearch && matchesStatus;
  });
}

function selectedDocument() {
  return state.documents.find((doc) => doc.id === state.selectedDocumentId) || state.documents[0] || null;
}

function selectedFrom(docs) {
  return docs.find((doc) => doc.id === state.selectedDocumentId) || docs[0] || null;
}

function countStatus(status) {
  return state.documents.filter((doc) => doc.status === status).length;
}

function canSubmit(doc) {
  return doc && ['draft', 'changes_requested'].includes(doc.status) && (doc.ownerId === state.user?.id || state.user?.role === 'admin');
}

function canReview(doc) {
  return doc && doc.status === 'pending' && (state.user?.role === 'admin' || doc.assignedTo === state.user?.id);
}

async function submitDocument(docId) {
  try {
    await api(`/api/documents/${docId}/submit`, { method: 'PATCH' });
    await refresh('Document submitted for approval.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function addComment(docId, body) {
  try {
    await api(`/api/documents/${docId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
    await refresh('Comment added.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function decideDocument(docId, decision, note) {
  try {
    await api(`/api/documents/${docId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, note })
    });
    state.decisionModal = null;
    const label = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'sent back for changes';
    await refresh(`Document ${label}.`);
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function uploadDocument(form) {
  const data = new FormData(form);
  if (!data.get('file') || !data.get('file').name) {
    toast('Attach a document file first.', 'error');
    return;
  }

  try {
    await api('/api/documents', { method: 'POST', body: data });
    form.reset();
    state.route = 'documents';
    await refresh('Document uploaded successfully.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function uploadDocumentVersion(form, docId) {
  const data = new FormData(form);
  if (!data.get('file') || !data.get('file').name) {
    toast('Attach a revised document file first.', 'error');
    return;
  }

  try {
    await api(`/api/documents/${docId}/versions`, { method: 'POST', body: data });
    form.reset();
    await refresh('New document version uploaded.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function downloadDocument(doc) {
  try {
    const response = await fetch(`/api/documents/${doc.id}/download`, {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Could not download this file.' }));
      throw new Error(payload.error || 'Could not download this file.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || 'document';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    toast(error.message, 'error');
  }
}

/* ============================================================
   HERO / LOGIN PAGE
   ============================================================ */
function loginPage() {
  return `
    <div class="hero-page">

      <!-- Fixed navigation -->
      <header class="hero-nav" id="heroNav">
        <div class="hero-nav-inner">
          <div class="hero-nav-left">
            <a href="./index.html" class="hero-brand" aria-label="SecureDoc home">
              <div class="brand-logo">${icon('shield')}</div>
              <span class="brand-name">Secure<b>Doc</b></span>
            </a>
            <button class="hero-menu-btn" id="heroMenuBtn" aria-label="Open Menu" aria-expanded="false">
              <span class="menu-icon-open">${icon('menu')}</span>
              <span class="menu-icon-close" style="display:none">${icon('x')}</span>
            </button>
          </div>

          <nav class="hero-nav-links" aria-label="Site navigation">
            <a href="#features">Features</a>
            <a href="#solution">Solution</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </nav>

          <div class="hero-nav-cta">
            <button class="btn ghost small hero-scroll-signin" id="heroLoginBtn">Login</button>
            <button class="btn primary small hero-scroll-signin" id="heroSignupBtn">Sign Up</button>
            <button class="btn primary small hero-scroll-signin" id="heroGetStartedBtn" style="display:none">Get Started</button>
          </div>
        </div>

        <div class="hero-mobile-nav" id="heroMobileNav" style="display:none">
          <nav class="hero-mobile-links">
            <a href="#features">Features</a>
            <a href="#solution">Solution</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </nav>
          <div class="hero-mobile-cta">
            <button class="btn ghost full hero-scroll-signin">Login</button>
            <button class="btn primary full hero-scroll-signin">Sign Up</button>
          </div>
        </div>
      </header>

      <!-- Hero section -->
      <main class="hero-main">
        <div class="hero-bg-blur-l" aria-hidden="true"></div>
        <div class="hero-bg-vignette" aria-hidden="true"></div>

        <section class="hero-section">
          <div class="hero-content">
            <a href="#heroSignin" class="hero-badge hero-anim delay-0">
              <span>${icon('shield')} Introducing tamper-evident audit trails</span>
              <span class="hero-badge-sep"></span>
              <span class="hero-badge-arrow">
                <span class="hero-badge-arrows">${icon('arrow-right')}${icon('arrow-right')}</span>
              </span>
            </a>

            <h1 class="hero-headline hero-anim delay-1">
              Secure Document Approvals<br>
              <span class="hero-grad">with Audit Evidence</span>
            </h1>

            <p class="hero-desc hero-anim delay-2">
              Upload, review and approve documents with role-based access, SHA-256 fingerprints,
              version history, approval receipts and a tamper-evident audit trail.
            </p>

            <div class="hero-ctas hero-anim delay-3">
              <div class="hero-cta-border">
                <button class="btn primary hero-cta-btn hero-scroll-signin">Get Started</button>
              </div>
              <button class="btn ghost hero-cta-btn hero-scroll-signin">View demo</button>
            </div>
          </div>

          <div class="hero-screen-wrap hero-anim delay-4">
            <div class="hero-screen-fade" aria-hidden="true"></div>
            <div class="hero-screen-frame">
              <div class="preview-chrome"><i></i><i></i><i></i><span>secure-doc.app/workspace</span></div>
              <div class="preview-inner hero-screen-inner">
                <div class="preview-side">
                  <div class="ps-brand"><span class="dot">${icon('shield')}</span>SecureDoc</div>
                  <a class="active">${icon('grid')}Dashboard</a>
                  <a>${icon('folder')}Documents</a>
                  <a>${icon('check')}Review</a>
                  <a>${icon('clock')}Audit</a>
                </div>
                <div class="preview-main">
                  <div class="preview-head">
                    <div>
                      <span class="preview-kicker">Live workspace</span>
                      <div class="pm-title">Approval dashboard</div>
                    </div>
                    <span class="verified-chip">${icon('badge-check')}Verified</span>
                  </div>
                  <div class="preview-stats">
                    <div><strong>2</strong><span>Pending</span></div>
                    <div><strong>4</strong><span>Approved</span></div>
                    <div><strong>1</strong><span>Changes</span></div>
                  </div>
                  <div class="preview-rows">
                    <div class="pr"><span class="pr-ic">${icon('file-text')}</span><span class="pr-body"><b>Vendor Agreement</b><span>Legal · due Jun 25</span></span><span class="mini-pill pending">Pending</span></div>
                    <div class="pr"><span class="pr-ic">${icon('file-text')}</span><span class="pr-body"><b>Onboarding Checklist</b><span>HR · approved</span></span><span class="mini-pill approved">Approved</span></div>
                    <div class="pr"><span class="pr-ic">${icon('file-text')}</span><span class="pr-body"><b>Policy Update</b><span>Compliance · needs edits</span></span><span class="mini-pill changes">Changes</span></div>
                  </div>
                  <div class="evidence-strip">
                    <span>${icon('hash')}</span>
                    <div><strong>SHA-256 fingerprint attached</strong><small>87f38f12a9b0b30e...</small></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Trusted-by logos -->
        <section class="hero-logos" aria-label="Trusted by">
          <p class="hero-logos-label">Trusted by security-conscious teams worldwide</p>
          <div class="hero-logos-grid">
            <div class="hero-logo"><img src="https://html.tailus.io/blocks/customers/nvidia.svg" alt="Nvidia" height="18"></div>
            <div class="hero-logo"><img src="https://html.tailus.io/blocks/customers/github.svg" alt="GitHub" height="15"></div>
            <div class="hero-logo"><img src="https://html.tailus.io/blocks/customers/nike.svg" alt="Nike" height="18"></div>
            <div class="hero-logo"><img src="https://html.tailus.io/blocks/customers/openai.svg" alt="OpenAI" height="22"></div>
            <div class="hero-logo"><img src="https://html.tailus.io/blocks/customers/laravel.svg" alt="Laravel" height="15"></div>
            <div class="hero-logo"><img src="https://html.tailus.io/blocks/customers/lilly.svg" alt="Lilly" height="26"></div>
            <div class="hero-logo"><img src="https://html.tailus.io/blocks/customers/column.svg" alt="Column" height="14"></div>
            <div class="hero-logo"><img src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg" alt="Lemon Squeezy" height="18"></div>
          </div>
        </section>

        <!-- Features section -->
        <section class="hero-features" id="features">
          <div class="hero-features-inner">
            <div class="hero-section-kicker">How it works</div>
            <h2 class="hero-section-title">Everything you need for<br><span class="hero-grad">secure document approvals</span></h2>
            <p class="hero-section-sub">A complete workflow from upload to archived approval receipt — with cryptographic proof at every step.</p>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon feature-icon-blue">${icon('users')}</div>
                <h3>Role-Based Access</h3>
                <p>Submitters, reviewers, and admins each see only what their role permits. Tight permission boundaries by design.</p>
                <ul class="feature-list">
                  <li>${icon('check')} Submitter · Reviewer · Admin roles</li>
                  <li>${icon('check')} Per-document reviewer assignment</li>
                  <li>${icon('check')} Audit-logged access denials</li>
                </ul>
              </div>
              <div class="feature-card">
                <div class="feature-icon feature-icon-violet">${icon('hash')}</div>
                <h3>SHA-256 Fingerprinting</h3>
                <p>Every uploaded file gets a cryptographic hash stored alongside its metadata — tamper-proof and permanently linked to its approval.</p>
                <ul class="feature-list">
                  <li>${icon('check')} Computed on every upload</li>
                  <li>${icon('check')} Visible on approval receipts</li>
                  <li>${icon('check')} Detects silent file changes</li>
                </ul>
              </div>
              <div class="feature-card">
                <div class="feature-icon feature-icon-cyan">${icon('clock')}</div>
                <h3>Tamper-Evident Audit Trail</h3>
                <p>Every action — login, upload, approve, reject, comment, download — is chained with the previous event hash. Nothing can be quietly deleted.</p>
                <ul class="feature-list">
                  <li>${icon('check')} Immutable append-only log</li>
                  <li>${icon('check')} Actor · role · timestamp on every event</li>
                  <li>${icon('check')} Exportable audit report</li>
                </ul>
              </div>
              <div class="feature-card feature-card-wide">
                <div class="feature-wide-left">
                  <div class="feature-icon feature-icon-amber">${icon('file-text')}</div>
                  <h3>Version History & Receipts</h3>
                  <p>Upload revised documents without losing the original. Every approval generates a dated receipt with the file fingerprint, reviewer name, and decision note.</p>
                  <ul class="feature-list">
                    <li>${icon('check')} Full version chain per document</li>
                    <li>${icon('check')} Downloadable approval receipts</li>
                    <li>${icon('check')} Change-request workflow with notes</li>
                  </ul>
                </div>
                <div class="feature-wide-right">
                  <div class="feature-receipt">
                    <div class="fr-row fr-head">
                      <span class="fr-label">Approval Receipt</span>
                      <span class="verified-chip" style="font-size:0.62rem">${icon('badge-check')} Verified</span>
                    </div>
                    <div class="fr-row"><span>Document</span><b>Vendor Agreement v2</b></div>
                    <div class="fr-row"><span>Decision</span><b class="fr-approved">Approved</b></div>
                    <div class="fr-row"><span>Reviewer</span><b>Maya Chen</b></div>
                    <div class="fr-row"><span>Date</span><b>Jun 20, 2025 · 14:32</b></div>
                    <div class="fr-row fr-hash"><span>${icon('hash')}</span><code>87f38f12a9b0b30e…</code></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Sign-in section — centered, no duplicate preview -->
        <section class="hero-signin-section" id="heroSignin">
          <div class="signin-glow" aria-hidden="true"></div>
          <div class="hero-signin-inner">
            <div class="hero-signin-head">
              <span class="eyebrow">${icon('shield')}Interactive demo</span>
              <h2>Pick a role. <span class="hero-grad">Explore instantly.</span></h2>
              <p>Three accounts with different permissions — no setup, no credit card.</p>
            </div>
            <div class="signin-centered-wrap">
              <aside class="signin-card signin-card-centered" aria-label="Choose a demo role">
                <p class="signin-sub">All accounts use password <code class="demo-pw">demo123</code></p>
                <div class="role-list">
                  ${demoAccounts.map((account) => `
                    <button class="role-card ${account.color}" data-login-email="${account.email}" data-login-password="${account.password}">
                      <span class="role-ic">${icon(account.icon)}</span>
                      <span class="role-body">
                        <strong>${escapeHtml(account.label)}</strong>
                        <span class="role-desc-line">${escapeHtml(account.role)}</span>
                        <span class="role-email">${escapeHtml(account.email)}</span>
                      </span>
                      <span class="role-arrow">${icon('arrow-right')}</span>
                    </button>
                  `).join('')}
                </div>
                <div class="signin-note">
                  ${icon('lock')}
                  <span>Demo accounts — fictional data only. Sessions expire after 2 hours. All logins are recorded in the audit trail.</span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <footer class="hero-footer">
          <p>© 2025 SecureDoc · Demo environment · <span class="hdr-demo"><span class="dot"></span>Interactive demo</span></p>
        </footer>
      </main>
    </div>
  `;
}

function shell(content) {
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
      <div class="sidebar-brand">
        <div class="logo-mark">${icon('shield')}</div>
        <div>
          <h1>SecureDoc</h1>
          <p>Approval platform</p>
        </div>
      </div>
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

function sectionTitle(title, body, action = '') {
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

/* ============================================================
   DASHBOARD
   ============================================================ */
function urgencyChip(doc) {
  if (!doc.dueDate) return '';
  const diffMs = new Date(doc.dueDate) - Date.now();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0)  return `<span class="urgency-chip overdue">${icon('alert-triangle')}Overdue</span>`;
  if (diffDays === 0) return `<span class="urgency-chip due-today">${icon('bell')}Due today</span>`;
  if (diffDays <= 3) return `<span class="urgency-chip due-soon">${icon('clock')}Due in ${diffDays}d</span>`;
  return '';
}

function dashboardPage() {
  const stats = state.stats || {};
  const pending = state.documents.filter((doc) => doc.status === 'pending' && (state.user?.role === 'admin' || doc.assignedTo === state.user?.id)).slice(0, 5);
  const recent = state.audit.slice(0, 6);
  const max = Math.max(1, ...statusOrder.map(countStatus));
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
            ${statusOrder.map((status) => `
              <div class="stage" style="--fill:${Math.max(0.08, countStatus(status) / max)}">
                <span>${statusNames[status]}</span>
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

function pipelineCopy(status) {
  return {
    draft: 'Saved but not submitted',
    pending: 'Awaiting decision',
    changes_requested: 'Needs revision',
    approved: 'Receipt created',
    rejected: 'Closed as rejected'
  }[status] || 'Tracked';
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

/* ============================================================
   DOCUMENTS
   ============================================================ */
function documentsPage() {
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
        ${['all', ...statusOrder].map((status) => `<button class="${state.status === status ? 'active' : ''}" data-filter-status="${status}">${statusNames[status]}</button>`).join('')}
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

function submissionsPage() {
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
        ${['all', ...statusOrder].map((status) => `<button class="${state.status === status ? 'active' : ''}" data-filter-status="${status}">${statusNames[status]}</button>`).join('')}
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

function documentCard(doc, selected) {
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

function documentDetail(doc) {
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

/* ============================================================
   UPLOAD
   ============================================================ */
function uploadPage() {
  const steps = [
    { label: 'Attach file', done: false, active: true },
    { label: 'Add details', done: false, active: false },
    { label: 'Assign reviewer', done: false, active: false },
    { label: 'Submit', done: false, active: false }
  ];
  return `
    ${sectionTitle('Upload document', 'Attach a file, fill in details, assign a reviewer, then save as draft or submit immediately.')}
    <div class="upload-card">
      <div class="upload-steps">
        ${steps.map((s, i) => `
          <div class="upload-step ${s.active ? 'active' : ''} ${s.done ? 'done' : ''}">
            <span class="upload-step-num">${i + 1}</span>
            <span>${s.label}</span>
          </div>
          ${i < steps.length - 1 ? '<div class="upload-step-connector"></div>' : ''}
        `).join('')}
      </div>
      <form id="uploadForm" class="form-stack">
        <div class="upload-grid">
          <div class="field">
            <label>Document title</label>
            <input name="title" placeholder="e.g. Vendor Agreement - June 2026" required />
          </div>
          <div class="field">
            <label>Category</label>
            <select name="category">
              <option>Contract</option>
              <option>Invoice</option>
              <option>Policy</option>
              <option>HR Form</option>
              <option>Certificate</option>
              <option>General</option>
            </select>
          </div>
          <div class="field">
            <label>Department</label>
            <input name="department" value="${escapeHtml(state.user?.department || 'Operations')}" required />
          </div>
          <div class="field">
            <label>Confidentiality</label>
            <select name="confidentiality">
              <option>Internal</option>
              <option>Confidential</option>
              <option>Restricted</option>
            </select>
          </div>
          <div class="field">
            <label>Reviewer</label>
            <select name="assignedTo">
              ${state.reviewers.map((reviewer) => `<option value="${reviewer.id}">${escapeHtml(reviewer.name)} — ${escapeHtml(reviewer.roleName)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Due date</label>
            <input name="dueDate" type="date" />
          </div>
        </div>

        <label class="dropzone" id="dropzone">
          <div class="dz-ic">${icon('upload')}</div>
          <strong>Drag and drop, or click to attach a file</strong>
          <div class="dz-hint">PDF, Word, Excel, PNG, JPG or TXT · 10 MB max · extension, MIME and signature checked</div>
          <div class="dz-file">${icon('check-circle')}<span id="dzFileName"></span></div>
          <input name="file" type="file" id="fileInput" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt" required />
        </label>

        <div class="field">
          <label>Submission notes</label>
          <textarea name="notes" placeholder="Explain what the reviewer should check..."></textarea>
        </div>
        <div class="btn-row">
          <label class="toggle-row"><input type="checkbox" name="submitNow" value="true" /> Submit immediately after upload</label>
          <button class="btn primary" type="submit">${icon('upload')}Upload document</button>
          <button class="btn ghost" type="reset">Reset</button>
        </div>
      </form>
    </div>
  `;
}

/* ============================================================
   REVIEW QUEUE
   ============================================================ */
function reviewPage() {
  const canAccess = ['reviewer', 'admin'].includes(state.user?.role);
  const queue = state.documents.filter((doc) => doc.status === 'pending' && (state.user?.role === 'admin' || doc.assignedTo === state.user?.id));
  const doc = selectedFrom(queue);

  if (!canAccess) {
    return `
      ${sectionTitle('Review queue', 'Approval decisions are restricted to reviewers and admins.')}
      <div class="panel">
        ${empty('Your current role (Submitter) can upload documents, track their status, and respond to change requests — but cannot approve, reject, or request changes. Switch to a Reviewer or Admin account to access this area.', 'Restricted area')}
      </div>
    `;
  }

  return `
    ${sectionTitle('Review queue', `${queue.length} pending submission${queue.length === 1 ? '' : 's'} assigned to you. Inspect the fingerprint and hash before recording your decision.`)}
    <div class="detail-layout">
      <div class="doc-grid">
        ${queue.length
          ? queue.map((item) => documentCard(item, doc?.id === item.id)).join('')
          : empty('No pending documents are currently assigned to you. Documents submitted for review will appear here.', 'All clear')}
      </div>
      <aside class="panel detail-panel">
        ${doc
          ? documentDetail(doc)
          : empty('Select a document from the list to review its details, fingerprint and approval history before making a decision.', 'Select a document')}
      </aside>
    </div>
  `;
}

/* ============================================================
   AUDIT TRAIL
   ============================================================ */
function auditPage() {
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

function auditRowTimeline(event) {
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

function actionLabel(action) {
  return ACTION_LABELS[action] || String(action || 'event').split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

/* ============================================================
   SECURITY
   ============================================================ */
function securityPage() {
  const controls = [
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

  return `
    ${sectionTitle('Security controls', 'Implemented controls for this document approval and audit workflow prototype.')}
    <div class="security-grid">
      ${controls.map((card) => `
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

/* ============================================================
   DECISION MODAL
   ============================================================ */
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

function empty(message, title = '') {
  return `
    <div class="empty-card">
      ${icon('inbox')}
      ${title ? `<strong>${escapeHtml(title)}</strong>` : ''}
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/* ============================================================
   RENDER + EVENTS
   ============================================================ */
function render() {
  if (state.loading && state.token && !state.user) {
    app.innerHTML = `<div class="loading"><div><div class="spinner"></div><p>Loading secure workspace...</p></div></div>`;
    bindEvents();
    return;
  }

  if (!state.token || !state.user) {
    app.innerHTML = loginPage();
    bindEvents();
    return;
  }

  const page = {
    dashboard: dashboardPage,
    documents: documentsPage,
    submissions: submissionsPage,
    upload: uploadPage,
    review: reviewPage,
    audit: auditPage,
    security: securityPage
  }[state.route] || dashboardPage;

  app.innerHTML = shell(page());
  bindEvents();
  restoreFocusAfterRender();
  restoreScrollAfterRender();
}

function restoreFocusAfterRender() {
  if (!focusAfterRender) return;
  const { selector, start, end } = focusAfterRender;
  focusAfterRender = null;
  const target = document.querySelector(selector);
  if (!target) return;
  target.focus({ preventScroll: true });
  if (typeof target.setSelectionRange === 'function' && Number.isInteger(start) && Number.isInteger(end)) {
    target.setSelectionRange(start, end);
  }
}

function restoreScrollAfterRender() {
  if (!scrollTopAfterRender) return;
  scrollTopAfterRender = false;
  window.scrollTo({ top: 0, left: 0 });
}

function bindEvents() {
  // Clean up previous hero scroll handler before potentially adding a new one
  if (_heroScrollHandler) {
    window.removeEventListener('scroll', _heroScrollHandler);
    _heroScrollHandler = null;
  }

  // Hero page: fixed nav scroll shrink + mobile menu + CTA scroll
  const heroNav = document.getElementById('heroNav');
  if (heroNav) {
    const loginBtn = document.getElementById('heroLoginBtn');
    const signupBtn = document.getElementById('heroSignupBtn');
    const getStartedBtn = document.getElementById('heroGetStartedBtn');
    _heroScrollHandler = () => {
      const scrolled = window.scrollY > 50;
      heroNav.classList.toggle('hero-nav--scrolled', scrolled);
      if (loginBtn) loginBtn.style.display = scrolled ? 'none' : '';
      if (signupBtn) signupBtn.style.display = scrolled ? 'none' : '';
      if (getStartedBtn) getStartedBtn.style.display = scrolled ? '' : 'none';
    };
    window.addEventListener('scroll', _heroScrollHandler, { passive: true });

    const menuBtn = document.getElementById('heroMenuBtn');
    const mobileNav = document.getElementById('heroMobileNav');
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', () => {
        const isOpen = mobileNav.style.display === 'block';
        mobileNav.style.display = isOpen ? 'none' : 'block';
        menuBtn.querySelector('.menu-icon-open').style.display = isOpen ? '' : 'none';
        menuBtn.querySelector('.menu-icon-close').style.display = isOpen ? 'none' : '';
        menuBtn.setAttribute('aria-expanded', String(!isOpen));
        menuBtn.setAttribute('aria-label', isOpen ? 'Open Menu' : 'Close Menu');
      });
    }

    document.querySelectorAll('.hero-scroll-signin').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('heroSignin')?.scrollIntoView({ behavior: 'smooth' });
        if (mobileNav) mobileNav.style.display = 'none';
      });
    });

    document.querySelectorAll('.hero-mobile-links a').forEach((link) => {
      link.addEventListener('click', () => {
        if (mobileNav) mobileNav.style.display = 'none';
        if (menuBtn) {
          menuBtn.querySelector('.menu-icon-open').style.display = '';
          menuBtn.querySelector('.menu-icon-close').style.display = 'none';
          menuBtn.setAttribute('aria-expanded', 'false');
          menuBtn.setAttribute('aria-label', 'Open Menu');
        }
      });
    });
  }

  document.querySelectorAll('[data-login-email]').forEach((button) => {
    button.addEventListener('click', () => login(button.dataset.loginEmail, button.dataset.loginPassword));
  });

  document.querySelector('#loginForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    login(data.get('email'), data.get('password'));
  });

  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => setRoute(button.dataset.route));
  });

  document.querySelector('#mobileNavToggle')?.addEventListener('click', () => {
    state.mobileNavOpen = !state.mobileNavOpen;
    render();
  });

  document.querySelector('#sidebarBackdrop')?.addEventListener('click', () => {
    state.mobileNavOpen = false;
    render();
  });

  document.querySelector('#logoutBtn')?.addEventListener('click', logout);
  document.querySelector('#refreshBtn')?.addEventListener('click', () => refresh('Workspace refreshed.'));

  document.querySelector('#searchInput')?.addEventListener('input', (event) => {
    focusAfterRender = {
      selector: '#searchInput',
      start: event.currentTarget.selectionStart,
      end: event.currentTarget.selectionEnd
    };
    state.search = event.currentTarget.value;
    render();
  });

  document.querySelectorAll('[data-filter-status]').forEach((button) => {
    button.addEventListener('click', () => {
      state.status = button.dataset.filterStatus;
      render();
    });
  });

  document.querySelectorAll('[data-audit-filter]').forEach((select) => {
    select.addEventListener('change', () => {
      state.auditFilters[select.dataset.auditFilter] = select.value;
      render();
    });
  });

  document.querySelector('#clearAuditFilters')?.addEventListener('click', () => {
    state.auditFilters = { action: 'all', user: 'all', document: 'all', status: 'all' };
    render();
  });

  document.querySelectorAll('[data-select-doc]').forEach((card) => {
    card.addEventListener('click', () => {
      state.selectedDocumentId = card.dataset.selectDoc;
      render();
    });
  });

  document.querySelectorAll('[data-open-doc]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDocumentId = button.dataset.openDoc;
      setRoute('documents');
    });
  });

  document.querySelectorAll('[data-submit-doc]').forEach((button) => {
    button.addEventListener('click', () => submitDocument(button.dataset.submitDoc));
  });

  document.querySelectorAll('[data-download-doc]').forEach((button) => {
    button.addEventListener('click', () => {
      const doc = state.documents.find((item) => item.id === button.dataset.downloadDoc);
      if (doc) downloadDocument(doc);
    });
  });

  document.querySelectorAll('[data-decision]').forEach((button) => {
    button.addEventListener('click', () => {
      state.decisionModal = { docId: button.dataset.doc, decision: button.dataset.decision };
      render();
    });
  });

  document.querySelectorAll('[data-comment-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const body = new FormData(form).get('body');
      if (!String(body || '').trim()) return toast('Comment cannot be empty.', 'error');
      addComment(form.dataset.commentForm, body);
    });
  });

  document.querySelectorAll('[data-copy-hash]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyHash || '');
        toast('SHA-256 hash copied.');
      } catch (_error) {
        toast(button.dataset.copyHash || 'Hash unavailable.');
      }
    });
  });

  document.querySelector('#uploadForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    uploadDocument(event.currentTarget);
  });

  document.querySelectorAll('[data-version-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      uploadDocumentVersion(event.currentTarget, form.dataset.versionForm);
    });
  });

  const dropzone = document.querySelector('#dropzone');
  const fileInput = document.querySelector('#fileInput');
  const dzFileName = document.querySelector('#dzFileName');
  if (dropzone && fileInput) {
    const updateFileLabel = () => {
      const file = fileInput.files?.[0];
      if (file) {
        dropzone.classList.add('has-file');
        if (dzFileName) dzFileName.textContent = file.name;
      } else {
        dropzone.classList.remove('has-file');
      }
    };
    fileInput.addEventListener('change', updateFileLabel);
    ['dragover', 'dragenter'].forEach((evt) => {
      dropzone.addEventListener(evt, (event) => {
        event.preventDefault();
        dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'dragend'].forEach((evt) => {
      dropzone.addEventListener(evt, () => dropzone.classList.remove('dragover'));
    });
    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        fileInput.files = event.dataTransfer.files;
        updateFileLabel();
      }
    });
    updateFileLabel();
  }

  document.querySelector('#closeModalBtn')?.addEventListener('click', () => {
    state.decisionModal = null;
    render();
  });

  document.querySelector('#modalBackdrop')?.addEventListener('click', (event) => {
    if (event.target.id === 'modalBackdrop') {
      state.decisionModal = null;
      render();
    }
  });

  document.querySelector('#decisionForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const note = new FormData(event.currentTarget).get('note');
    decideDocument(state.decisionModal.docId, state.decisionModal.decision, note);
  });
}

loadData();
