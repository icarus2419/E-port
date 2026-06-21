import { state } from './state.js';
import { toast } from './utils.js';
import { login, logout, refresh } from './auth.js';
import { submitDocument, addComment, decideDocument, uploadDocument, uploadDocumentVersion, downloadDocument } from './actions.js';
import { loginPage } from './pages/login.js';
import { shell, sectionTitle } from './pages/shell.js';
import { dashboardPage } from './pages/dashboard.js';
import { documentsPage, submissionsPage } from './pages/documents.js';
import { uploadPage } from './pages/upload.js';
import { reviewPage } from './pages/review.js';
import { auditPage } from './pages/audit.js';
import { securityPage } from './pages/security.js';

const appEl = document.querySelector('#app');

let focusAfterRender = null;
let scrollTopAfterRender = false;
let _heroScrollHandler = null;

export function setRoute(route) {
  state.route = route;
  state.mobileNavOpen = false;
  scrollTopAfterRender = true;
  localStorage.setItem('sda_route', route);
  render();
}

export function render() {
  if (state.loading && state.token && !state.user) {
    appEl.innerHTML = `<div class="loading"><div><div class="spinner"></div><p>Loading secure workspace...</p></div></div>`;
    bindEvents();
    return;
  }

  if (!state.token || !state.user) {
    appEl.innerHTML = loginPage();
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

  appEl.innerHTML = shell(page());
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
  if (_heroScrollHandler) {
    window.removeEventListener('scroll', _heroScrollHandler);
    _heroScrollHandler = null;
  }

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
