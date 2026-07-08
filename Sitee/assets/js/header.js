import { header, nav, menuToggle, themeToggle, root, prefersReduced, THEME_STORAGE_KEY } from './shared.js';
import { setStoredTheme } from './theme.js';

const headerIsSolid = header?.classList.contains('solid');
const updateHeader = () => header?.classList.toggle('scrolled', Boolean(headerIsSolid || window.scrollY > 18));

const closeMenu = () => {
  nav?.classList.remove('open');
  nav?.setAttribute('aria-hidden', 'true');
  menuToggle?.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
  document.body.classList.remove('no-scroll');
};

const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
const navSections = navLinks
  .map((link) => [link, document.querySelector(link.getAttribute('href'))])
  .filter(([, section]) => section);
let navSectionOffsets = [];

const refreshNavSectionOffsets = () => {
  navSectionOffsets = navSections.map(([link, section]) => [link, section.offsetTop]);
};

const setActiveLink = () => {
  let active = null;
  const y = window.scrollY + 170;
  for (const [link, offsetTop] of navSectionOffsets) {
    if (offsetTop <= y) active = link;
  }
  navLinks.forEach((link) => link.classList.toggle('active', link === active));
};

const runScrollEffects = () => {
  updateHeader();
  setActiveLink();
};

let scrollRaf = 0;
const requestScrollEffects = () => {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    runScrollEffects();
  });
};

const refreshMetricsAndScrollEffects = () => {
  refreshNavSectionOffsets();
  runScrollEffects();
};

let metricsRaf = 0;
const requestMetricsRefresh = () => {
  if (metricsRaf) return;
  metricsRaf = requestAnimationFrame(() => {
    metricsRaf = 0;
    refreshMetricsAndScrollEffects();
  });
};

export function initHeader() {
  themeToggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'night' ? 'day' : 'night';
    setStoredTheme(nextTheme);
    try { localStorage.setItem(THEME_STORAGE_KEY, nextTheme); } catch {}
  });

  closeMenu();

  menuToggle?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open');
    nav?.setAttribute('aria-hidden', String(!isOpen));
    menuToggle.classList.toggle('open', Boolean(isOpen));
    menuToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('no-scroll', Boolean(isOpen));
  });

  window.addEventListener('pageshow', closeMenu);

  const desktopMenuQuery = window.matchMedia('(min-width: 761px)');
  const closeMenuOnDesktop = (event) => { if (event.matches) closeMenu(); };
  if (desktopMenuQuery.matches) closeMenu();
  if (desktopMenuQuery.addEventListener) {
    desktopMenuQuery.addEventListener('change', closeMenuOnDesktop);
  } else if (desktopMenuQuery.addListener) {
    desktopMenuQuery.addListener(closeMenuOnDesktop);
  }

  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

  /* Same-page anchors: drive one explicit scrollTo ourselves. Native
     fragment navigation ignores clicks when the hash is already in the
     URL (a dead "View Projects" click after a previous jump), so we
     compute the exact target position and scroll every time. pushState
     updates the URL without triggering a competing native scroll. */
  const anchorScrollOffset = () => {
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
    return Number.isFinite(padding) ? padding : 96;
  };
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      closeMenu();
      if (window.location.hash !== href) history.pushState(null, '', href);
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - anchorScrollOffset());
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  refreshMetricsAndScrollEffects();
  window.addEventListener('scroll', requestScrollEffects, { passive: true });
  window.addEventListener('resize', requestMetricsRefresh, { passive: true });
  window.addEventListener('orientationchange', requestMetricsRefresh, { passive: true });
  window.addEventListener('load', refreshMetricsAndScrollEffects, { once: true });
}
