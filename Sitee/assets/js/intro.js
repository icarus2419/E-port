import { prefersReduced, lightIntro, INTRO_SCROLL_STORAGE_KEY } from './shared.js';

const introPull = document.getElementById('introPull');
const heroLamp = document.getElementById('heroLamp');

let cleanupIntroHandlers = () => {};
let cleanupIntroLayoutHandlers = () => {};

const readSavedScrollY = () => {
  try {
    const saved = Number(sessionStorage.getItem(INTRO_SCROLL_STORAGE_KEY));
    return Number.isFinite(saved) ? saved : 0;
  } catch {
    return 0;
  }
};

const rememberScrollY = () => {
  try {
    sessionStorage.setItem(INTRO_SCROLL_STORAGE_KEY, String(Math.max(0, Math.round(window.scrollY || 0))));
  } catch {}
};

const getNavigationType = () => {
  const entry = performance.getEntriesByType?.('navigation')?.[0];
  return entry?.type || performance.navigation?.type || 'navigate';
};

const shouldSkipIntroLock = () => {
  const navType = getNavigationType();
  const savedScrollY = readSavedScrollY();
  return Boolean(
    window.location.hash ||
    window.scrollY > 24 ||
    ((navType === 'reload' || navType === 'back_forward' || navType === 1 || navType === 2) && savedScrollY > 24)
  );
};

const positionIntroSpotlight = () => {
  if (!lightIntro || !heroLamp) return;
  if (document.body.classList.contains('light-has-switched')) return;
  const parts = [
    heroLamp.querySelector('.cord'),
    heroLamp.querySelector('.shade'),
    heroLamp.querySelector('.hero-pull-label'),
    introPull
  ].filter(Boolean);
  if (!parts.length) return;
  const rects = parts.map((el) => el.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  if (right <= left || bottom <= top) return;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const rx = Math.max(95, (right - left) / 2 + 26) / 0.84;
  const ry = Math.max(130, (bottom - top) / 2 + 26) / 0.84;
  lightIntro.style.setProperty('--lamp-x', `${cx.toFixed(1)}px`);
  lightIntro.style.setProperty('--lamp-y', `${cy.toFixed(1)}px`);
  lightIntro.style.setProperty('--lamp-rx', `${rx.toFixed(1)}px`);
  lightIntro.style.setProperty('--lamp-ry', `${ry.toFixed(1)}px`);
};

const unlockIntroScroll = () => {
  document.body.classList.add('intro-scroll-free');
};

const finishIntro = () => {
  lightIntro?.classList.add('light-on', 'intro-hidden');
  document.body.classList.add('light-has-switched');
  document.body.classList.remove('intro-active', 'intro-pulling', 'intro-scroll-free');
  introPull?.setAttribute('aria-disabled', 'true');
  cleanupIntroHandlers();
  cleanupIntroLayoutHandlers();
};

const playSwitchSound = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;

    const tick = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    tick.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2400;
    band.Q.value = 1.1;
    const tickGain = ctx.createGain();
    tickGain.gain.setValueAtTime(0.35, t0);
    tick.connect(band);
    band.connect(tickGain);
    tickGain.connect(ctx.destination);
    tick.start(t0);

    const clunk = ctx.createOscillator();
    clunk.type = 'triangle';
    clunk.frequency.setValueAtTime(185, t0 + 0.24);
    clunk.frequency.exponentialRampToValueAtTime(70, t0 + 0.36);
    const clunkGain = ctx.createGain();
    clunkGain.gain.setValueAtTime(0.0001, t0 + 0.24);
    clunkGain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.26);
    clunkGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.52);
    clunk.connect(clunkGain);
    clunkGain.connect(ctx.destination);
    clunk.start(t0 + 0.24);
    clunk.stop(t0 + 0.55);

    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(330, t0 + 0.26);
    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.0001, t0 + 0.26);
    humGain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.6);
    humGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
    hum.connect(humGain);
    humGain.connect(ctx.destination);
    hum.start(t0 + 0.26);
    hum.stop(t0 + 1.35);

    window.setTimeout(() => { ctx.close().catch(() => {}); }, 2000);
  } catch {
    /* Sound is decorative; never block the reveal. */
  }
};

export function initIntro() {
  window.addEventListener('pagehide', rememberScrollY);
  window.addEventListener('beforeunload', rememberScrollY);

  if (!lightIntro && !introPull) return;

  if (!lightIntro) {
    return;
  }

  if (!introPull) {
    finishIntro();
    return;
  }

  if (shouldSkipIntroLock()) {
    const savedScrollY = readSavedScrollY();
    finishIntro();
    if (!window.location.hash && savedScrollY > 24) {
      requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
      window.setTimeout(() => window.scrollTo(0, savedScrollY), 80);
    }
    return;
  }

  document.body.classList.add('intro-active');
  document.body.classList.remove('intro-scroll-free');
  introPull.setAttribute('aria-disabled', 'false');

  positionIntroSpotlight();
  requestAnimationFrame(positionIntroSpotlight);
  window.addEventListener('load', positionIntroSpotlight, { once: true });
  window.setTimeout(positionIntroSpotlight, 350);
  window.setTimeout(positionIntroSpotlight, 1200);
  window.addEventListener('resize', positionIntroSpotlight, { passive: true });
  window.addEventListener('orientationchange', positionIntroSpotlight);
  cleanupIntroLayoutHandlers = () => {
    window.removeEventListener('load', positionIntroSpotlight);
    window.removeEventListener('resize', positionIntroSpotlight);
    window.removeEventListener('orientationchange', positionIntroSpotlight);
    cleanupIntroLayoutHandlers = () => {};
  };

  if (prefersReduced) {
    window.setTimeout(finishIntro, 160);
    return;
  }

  let switchedOn = false;
  let firstIntroClickAt = 0;

  const turnOn = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (switchedOn) return;
    switchedOn = true;
    firstIntroClickAt = Date.now();
    introPull.setAttribute('aria-disabled', 'true');
    playSwitchSound();
    unlockIntroScroll();
    document.body.classList.add('intro-pulling');
    window.setTimeout(() => {
      document.body.classList.add('light-has-switched');
      lightIntro.classList.add('light-on');
    }, 180);
    window.setTimeout(() => lightIntro.classList.add('intro-hidden'), 760);
    window.setTimeout(finishIntro, 980);
  };

  const activateIntroFromAnywhere = (event) => {
    if (!document.body.classList.contains('intro-active')) return;
    if (switchedOn) {
      if (Date.now() - firstIntroClickAt < 450) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
        event.stopPropagation?.();
      }
      return;
    }
    turnOn(event);
  };

  const handleIntroKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') turnOn(e);
  };

  document.addEventListener('pointerdown', activateIntroFromAnywhere, { capture: true });
  document.addEventListener('click', activateIntroFromAnywhere, { capture: true });
  introPull.addEventListener('click', turnOn);
  introPull.addEventListener('keydown', handleIntroKeydown);

  cleanupIntroHandlers = () => {
    document.removeEventListener('pointerdown', activateIntroFromAnywhere, { capture: true });
    document.removeEventListener('click', activateIntroFromAnywhere, { capture: true });
    introPull.removeEventListener('click', turnOn);
    introPull.removeEventListener('keydown', handleIntroKeydown);
    cleanupIntroHandlers = () => {};
  };

  window.setTimeout(() => {
    if (!switchedOn) finishIntro();
  }, 30000);
}
