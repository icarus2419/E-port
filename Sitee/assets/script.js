(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('primaryNav');
  const menuToggle = document.getElementById('menuToggle');
  const themeToggle = document.getElementById('themeToggle');
  const lightIntro = document.getElementById('lightIntro');

  const THEME_STORAGE_KEY = 'jds-theme-v2';
  const INTRO_SCROLL_STORAGE_KEY = 'jds-last-scroll-y';
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

  window.addEventListener('pagehide', rememberScrollY);
  window.addEventListener('beforeunload', rememberScrollY);

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


  const setStoredTheme = (theme) => {
    const safeTheme = theme === 'day' ? 'day' : 'night';
    root.dataset.theme = safeTheme;
    themeToggle?.setAttribute('aria-pressed', String(safeTheme === 'day'));
    themeToggle?.setAttribute('aria-label', safeTheme === 'day' ? 'Switch to dark theme' : 'Switch to light theme');
  };

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'day' || savedTheme === 'night') setStoredTheme(savedTheme);
    else setStoredTheme(root.dataset.theme || 'night');
  } catch {
    setStoredTheme(root.dataset.theme || 'night');
  }

  // Real hero-lamp intro: the homepage is already present, just dark.
  const introPull = document.getElementById('introPull');
  const heroLamp = document.getElementById('heroLamp');

  // Aim the dark overlay's transparent "spotlight hole" at the actual lamp,
  // so the cord, shade, dark bulb, and pull cord stay clearly visible while
  // the rest of the page is only faintly lit. Re-measured on resize.
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
    // The cutout is fully clear up to ~84% of the ellipse radius with a fast
    // feather after, so scale the half-size (plus a sliver) up by that factor.
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

  if (lightIntro && introPull) {
    if (shouldSkipIntroLock()) {
      const savedScrollY = readSavedScrollY();
      finishIntro();
      if (!window.location.hash && savedScrollY > 24) {
        requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
        window.setTimeout(() => window.scrollTo(0, savedScrollY), 80);
      }
    } else {
      document.body.classList.add('intro-active');
      document.body.classList.remove('intro-scroll-free');
      introPull.setAttribute('aria-disabled', 'false');

      positionIntroSpotlight();
      requestAnimationFrame(positionIntroSpotlight);
      // Re-measure once webfonts/layout settle and on viewport changes.
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
      } else {
        // Soft synthesized pull-switch sound: cord tick on pull, a low clunk
        // when the light engages (240ms), and a quiet warm swell as it spreads.
        // Created inside the activation gesture, so autoplay policies allow it.
        const playSwitchSound = () => {
          try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const t0 = ctx.currentTime;

            // 1) Cord pull: short burst of band-passed noise.
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

            // 2) Switch clunk as the bulb engages.
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

            // 3) Gentle warm swell while the light spreads.
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
          } catch (err) {
            /* Sound is decorative; never block the reveal. */
          }
        };

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
          // 1) Cord tugs down, but scrolling is released immediately.
          unlockIntroScroll();
          document.body.classList.add('intro-pulling');
          // 2) Bulb + cone come on; the room starts brightening out from the lamp.
          window.setTimeout(() => {
            document.body.classList.add('light-has-switched');
            lightIntro.classList.add('light-on');
          }, 180);
          // 3) Fade the intro quickly and clean up the lock/listener state.
          window.setTimeout(() => lightIntro.classList.add('intro-hidden'), 760);
          window.setTimeout(finishIntro, 980);
        };

        const activateIntroFromAnywhere = (event) => {
          if (!document.body.classList.contains('intro-active')) return;
          // Swallow the original click that turned the lamp on so a button/link
          // behind the dark overlay does not also fire by accident.
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

        // Failsafe only: do not auto-play quickly, but never leave the page trapped.
        window.setTimeout(() => {
          if (!switchedOn) finishIntro();
        }, 30000);
      }
    }
  } else if (lightIntro) {
    finishIntro();
  }

  const headerIsSolid = header?.classList.contains('solid');
  const updateHeader = () => header?.classList.toggle('scrolled', Boolean(headerIsSolid || window.scrollY > 18));

  themeToggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'night' ? 'day' : 'night';
    setStoredTheme(nextTheme);
    try { localStorage.setItem(THEME_STORAGE_KEY, nextTheme); } catch {}
  });

  const closeMenu = () => {
    nav?.classList.remove('open');
    nav?.setAttribute('aria-hidden', 'true');
    menuToggle?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('no-scroll');
  };

  // Force the mobile menu to start closed on iOS/Safari back-forward cache restores too.
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

  // Use a media-query change listener instead of a raw resize handler so mobile
  // browser chrome show/hide does not keep firing menu-close work while scrolling.
  const desktopMenuQuery = window.matchMedia('(min-width: 761px)');
  const closeMenuOnDesktop = (event) => {
    if (event.matches) closeMenu();
  };
  if (desktopMenuQuery.matches) closeMenu();
  if (desktopMenuQuery.addEventListener) {
    desktopMenuQuery.addEventListener('change', closeMenuOnDesktop);
  } else if (desktopMenuQuery.addListener) {
    desktopMenuQuery.addListener(closeMenuOnDesktop);
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    });
  });

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

  refreshMetricsAndScrollEffects();
  window.addEventListener('scroll', requestScrollEffects, { passive: true });
  window.addEventListener('resize', requestMetricsRefresh, { passive: true });
  window.addEventListener('orientationchange', requestMetricsRefresh, { passive: true });
  window.addEventListener('load', refreshMetricsAndScrollEffects, { once: true });

  const revealItems = [...document.querySelectorAll('.reveal')];
  if (prefersReduced) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
      revealObserver.observe(item);
    });
  }

  if (!prefersReduced && window.matchMedia('(pointer:fine)').matches) {
    const blob = document.getElementById('cursorBlob');
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let blobRaf = 0;

    const renderBlob = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      if (blob) blob.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%)`;

      const stillMoving = Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4;
      if (stillMoving) {
        blobRaf = requestAnimationFrame(renderBlob);
      } else {
        blobRaf = 0;
      }
    };

    const requestBlobFrame = () => {
      if (!blob || blobRaf) return;
      blobRaf = requestAnimationFrame(renderBlob);
    };

    if (blob) {
      window.addEventListener('pointermove', (event) => {
        tx = event.clientX;
        ty = event.clientY;
        if (!document.body.classList.contains('intro-active')) {
          blob.style.opacity = '.95';
        }
        requestBlobFrame();
      }, { passive: true });

      window.addEventListener('pointerleave', () => {
        blob.style.opacity = '0';
        requestBlobFrame();
      }, { passive: true });
    }


    document.querySelectorAll('.skill-panel').forEach((card) => {
      let cardRect = null;
      let shineRaf = 0;
      let shineX = 0;
      let shineY = 0;

      const applySkillShine = () => {
        shineRaf = 0;
        if (!cardRect || cardRect.width <= 0 || cardRect.height <= 0) return;
        const xRatio = Math.min(Math.max(shineX / cardRect.width, 0), 1);
        const yRatio = Math.min(Math.max(shineY / cardRect.height, 0), 1);
        card.style.setProperty('--hover-x', `${(xRatio * 100).toFixed(1)}%`);
        card.style.setProperty('--hover-y', `${(yRatio * 100).toFixed(1)}%`);
      };

      card.addEventListener('pointerenter', (event) => {
        cardRect = card.getBoundingClientRect();
        shineX = event.clientX - cardRect.left;
        shineY = event.clientY - cardRect.top;
        if (!shineRaf) shineRaf = requestAnimationFrame(applySkillShine);
      }, { passive: true });

      card.addEventListener('pointermove', (event) => {
        if (!cardRect) cardRect = card.getBoundingClientRect();
        shineX = event.clientX - cardRect.left;
        shineY = event.clientY - cardRect.top;
        if (!shineRaf) shineRaf = requestAnimationFrame(applySkillShine);
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        if (shineRaf) cancelAnimationFrame(shineRaf);
        shineRaf = 0;
        cardRect = null;
        card.style.setProperty('--hover-x', '50%');
        card.style.setProperty('--hover-y', '0%');
      }, { passive: true });
    });

    document.querySelectorAll('.tilt-card').forEach((card) => {
      let rect = null;
      let tiltRaf = 0;
      let tiltX = 0;
      let tiltY = 0;

      const applyTilt = () => {
        tiltRaf = 0;
        const rotateY = ((tiltX / rect.width) - 0.5) * 8;
        const rotateX = (0.5 - (tiltY / rect.height)) * 8;
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      };

      card.addEventListener('pointerenter', () => {
        rect = card.getBoundingClientRect();
        card.classList.add('is-tilting');
      }, { passive: true });

      card.addEventListener('pointermove', (event) => {
        if (!rect) rect = card.getBoundingClientRect();
        tiltX = event.clientX - rect.left;
        tiltY = event.clientY - rect.top;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        if (tiltRaf) cancelAnimationFrame(tiltRaf);
        tiltRaf = 0;
        rect = null;
        card.classList.remove('is-tilting');
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
      }, { passive: true });
    });
  }

  const snippets = [
    ['<em>const</em> developer = {', '&nbsp;&nbsp;name: "Joseph",', '&nbsp;&nbsp;focus: ["Web", "APIs", "UX"]', '}'],
    ['<em>while</em> (learning) {', '&nbsp;&nbsp;build(newProjects);', '&nbsp;&nbsp;improve(skills);', '}'],
    ['<em>ship</em>({', '&nbsp;&nbsp;frontend: "polished",', '&nbsp;&nbsp;backend: "reliable",', '&nbsp;&nbsp;impact: true', '});']
  ];
  let snippetIndex = 0;
  const terminal = document.getElementById('terminalText');
  const miniRun = document.getElementById('miniRun');
  miniRun?.addEventListener('click', () => {
    snippetIndex = (snippetIndex + 1) % snippets.length;
    if (terminal) terminal.innerHTML = snippets[snippetIndex].map((line) => `<p>${line}</p>`).join('');
  });

  document.querySelectorAll('.deal-button').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.poker-art')?.classList.toggle('dealt');
    });
  });

  /* Featured video button:
     Copy the clean iris-close from the reference build, then redirect to 3D
     once the circle has fully closed. */
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
    iris.classList.add('active');

    animateIrisRadius(iris, maxRadius, 0, 860, () => {
      onClosed?.();
    });
  };

  document.querySelectorAll('.hero-video').forEach((btn) => {
    const vid = btn.querySelector('.hero-vid');

    if (vid) {
      vid.addEventListener('error', () => btn.classList.add('video-fallback'), { once: true });
    }

    if (prefersReduced && vid) {
      vid.removeAttribute('autoplay');
      vid.pause();
    } else if (vid) {
      const tryPlay = () => vid.play().catch(() => {});
      tryPlay();
      vid.addEventListener('canplay', tryPlay, { once: true });
    }

    btn.addEventListener('click', (e) => {
      const href = (btn.getAttribute('href') || '').trim();
      const hasRealDestination = href && href !== '#' && !href.startsWith('#');
      const destination = hasRealDestination ? href : '/3D/INDEX.HTML';
      const isModifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;

      if (isModifiedClick && hasRealDestination) return;

      e.preventDefault();

      if (irisTransitionRunning) {
        return;
      }

      playIrisClose(btn, () => {
        window.setTimeout(() => window.location.assign(destination), 90);
      });
    });
  });
})();
