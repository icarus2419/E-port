import { prefersReduced } from './shared.js';

const getIrisTransition = () => {
  let iris = document.getElementById('irisTransition');
  if (!iris) {
    iris = document.createElement('div');
    iris.id = 'irisTransition';
    iris.className = 'iris-transition';
    iris.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iris);
  }
  return iris;
};

const easeInOutCubic = (t) => (
  t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
);

let irisTransitionRunning = false;
let irisTransitionWatchdog = 0;

const resetIrisTransition = () => {
  irisTransitionRunning = false;
  window.clearTimeout(irisTransitionWatchdog);
  irisTransitionWatchdog = 0;
  document.querySelectorAll('.iris-transition').forEach((iris) => {
    iris.classList.remove('active');
    iris.setAttribute('aria-hidden', 'true');
    iris.style.setProperty('--iris-radius', '160vmax');
    iris.style.removeProperty('--iris-x');
    iris.style.removeProperty('--iris-y');
  });
  document.querySelectorAll('.hero-video.is-launching').forEach((el) => {
    el.classList.remove('is-launching');
  });
  document.querySelectorAll('.hero-car-fly').forEach((el) => el.remove());
};

const animateIrisRadius = (iris, from, to, duration, done) => {
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = easeInOutCubic(progress);
    const radius = from + (to - from) * eased;
    iris.style.setProperty('--iris-radius', `${Math.max(0, radius).toFixed(2)}px`);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      done?.();
    }
  };
  requestAnimationFrame(tick);
};

const playIrisClose = (originElement, onClosed) => {
  if (irisTransitionRunning) return;
  irisTransitionRunning = true;

  const iris = getIrisTransition();
  const anchor = originElement.querySelector('.hero-video-play') || originElement;
  const rect = anchor.getBoundingClientRect();

  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const farthestX = Math.max(x, window.innerWidth - x);
  const farthestY = Math.max(y, window.innerHeight - y);
  const maxRadius = Math.ceil(Math.hypot(farthestX, farthestY)) + 80;

  iris.style.setProperty('--iris-x', `${x.toFixed(1)}px`);
  iris.style.setProperty('--iris-y', `${y.toFixed(1)}px`);
  iris.style.setProperty('--iris-radius', `${maxRadius}px`);
  iris.setAttribute('aria-hidden', 'false');
  iris.classList.add('active');

  animateIrisRadius(iris, maxRadius, 0, 860, () => {
    onClosed?.();
  });

  irisTransitionWatchdog = window.setTimeout(() => {
    if (!document.hidden) resetIrisTransition();
  }, 5200);
};

export function initIris() {
  window.addEventListener('pageshow', resetIrisTransition);
  window.addEventListener('pagehide', resetIrisTransition);
  window.addEventListener('popstate', resetIrisTransition);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resetIrisTransition();
  });

  document.querySelectorAll('.hero-video').forEach((btn) => {
    const vid = btn.querySelector('.hero-vid');

    if (vid) {
      const markFallback = () => btn.classList.add('video-fallback');
      vid.addEventListener('error', markFallback, { once: true });
      const source = vid.querySelector('source');
      if (source) source.addEventListener('error', markFallback, { once: true });
    }

    if (prefersReduced && vid) {
      vid.removeAttribute('autoplay');
      vid.pause();
    } else if (vid) {
      // The loop's source ships as data-src so the large file never competes
      // with first paint; attach it once the rest of the page has loaded.
      const startVideo = () => {
        const source = vid.querySelector('source[data-src]');
        if (source && !source.getAttribute('src')) {
          source.setAttribute('src', source.dataset.src);
          vid.load();
        }
        const tryPlay = () => vid.play().catch(() => {});
        tryPlay();
        vid.addEventListener('canplay', tryPlay, { once: true });
      };
      if (document.readyState === 'complete') startVideo();
      else window.addEventListener('load', startVideo, { once: true });
    }

    btn.addEventListener('click', (e) => {
      const href = (btn.getAttribute('href') || '').trim();
      const hasRealDestination = href && href !== '#' && !href.startsWith('#');
      const destination = hasRealDestination ? href : '/3D/';
      const isModifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;

      if (isModifiedClick && hasRealDestination) return;
      e.preventDefault();
      if (irisTransitionRunning) return;

      playIrisClose(btn, () => {
        window.setTimeout(() => window.location.assign(destination), 90);
      });
    });
  });
}
