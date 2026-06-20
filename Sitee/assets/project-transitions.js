
(() => {
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION = 920;
  const WATCHDOG = 1450;
  let overlay = null;
  let navTimer = 0;
  let watchdogTimer = 0;
  let navigating = false;

  const projectLabel = (slug) => ({
    'launchvault-client-content': 'LaunchVault',
    'secure-document-approval': 'SecureDoc'
  })[slug] || 'Project';

  function cleanup() {
    window.clearTimeout(navTimer);
    window.clearTimeout(watchdogTimer);
    navTimer = 0;
    watchdogTimer = 0;
    navigating = false;
    document.documentElement.classList.remove('project-transition-lock');
    document.body?.classList.remove('project-transition-lock');
    document.querySelectorAll('.project-transition-overlay').forEach((node) => node.remove());
    overlay = null;
  }

  function inferSlug(anchor, mode) {
    const explicit = anchor.getAttribute('data-project-name');
    if (explicit) return explicit;
    if (mode === 'to-project-1') return 'launchvault-client-content';
    if (mode === 'to-project-2') return 'secure-document-approval';
    try {
      const url = new URL(anchor.getAttribute('href'), window.location.href);
      if (url.pathname.includes('secure-document-approval')) return 'secure-document-approval';
      if (url.pathname.includes('launchvault-client-content')) return 'launchvault-client-content';
    } catch (_) {}
    return 'launchvault-client-content';
  }

  function markup(slug) {
    if (slug === 'secure-document-approval') {
      return '<div class="sd-doc one"></div><div class="sd-doc two"></div><div class="sd-doc three"></div><div class="sd-seal"></div><div class="sd-check"></div>';
    }
    return '<div class="lv-card one"></div><div class="lv-card two"></div><div class="lv-card three"></div><div class="lv-upload"></div><div class="lv-dot one"></div><div class="lv-dot two"></div><div class="lv-dot three"></div>';
  }

  function createOverlay(slug, mode) {
    cleanup();
    overlay = document.createElement('div');
    overlay.className = `project-transition-overlay project-${slug} mode-${mode}`;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `<div class="project-transition-stage">${markup(slug)}<div class="project-transition-title">${projectLabel(slug)}</div></div>`;
    document.body.appendChild(overlay);
    document.documentElement.classList.add('project-transition-lock');
    document.body.classList.add('project-transition-lock');
  }

  function eligibleClick(event, anchor) {
    if (!anchor || event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    const target = (anchor.getAttribute('target') || '').toLowerCase();
    if (target && target !== '_self') return false;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
    } catch (_) { return false; }
    return true;
  }

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[data-project-transition]');
    if (!eligibleClick(event, anchor)) return;

    const href = anchor.getAttribute('href');
    const url = new URL(href, window.location.href);
    const mode = anchor.getAttribute('data-project-transition') || 'to-project';
    const slug = inferSlug(anchor, mode);
    if (REDUCED) return;

    event.preventDefault();
    if (navigating) return;
    navigating = true;
    createOverlay(slug, mode);
    navTimer = window.setTimeout(() => { window.location.href = url.href; }, DURATION);
    watchdogTimer = window.setTimeout(() => {
      if (navigating) window.location.href = url.href;
      else cleanup();
    }, WATCHDOG);
  }, true);

  window.addEventListener('pageshow', cleanup);
  window.addEventListener('pagehide', cleanup);
  window.addEventListener('popstate', cleanup);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cleanup(); });
})();
