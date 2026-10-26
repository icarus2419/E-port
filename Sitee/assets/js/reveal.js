import { prefersReduced } from './shared.js';

export function initReveal() {
  const revealItems = [...document.querySelectorAll('.reveal')];
  if (prefersReduced) {
    revealItems.forEach((item) => item.classList.add('visible'));
    return;
  }
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      // Reveal the carousel as a row so a narrow preview is visible too.
      const items = entry.target.matches('[data-carousel-track]')
        ? entry.target.querySelectorAll('.reveal')
        : [entry.target];
      items.forEach((item) => item.classList.add('visible'));
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
    revealObserver.observe(item.closest('[data-carousel-track]') || item);
  });
}
