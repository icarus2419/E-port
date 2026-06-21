import { root, themeToggle, THEME_STORAGE_KEY } from './shared.js';

export function setStoredTheme(theme) {
  const safeTheme = theme === 'day' ? 'day' : 'night';
  root.dataset.theme = safeTheme;
  themeToggle?.setAttribute('aria-pressed', String(safeTheme === 'day'));
  themeToggle?.setAttribute('aria-label', safeTheme === 'day' ? 'Switch to dark theme' : 'Switch to light theme');
}

export function initTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'day' || savedTheme === 'night') setStoredTheme(savedTheme);
    else setStoredTheme(root.dataset.theme || 'night');
  } catch {
    setStoredTheme(root.dataset.theme || 'night');
  }
}
