(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('primaryNav');
  const menuToggle = document.getElementById('menuToggle');
  const themeToggle = document.getElementById('themeToggle');
  const lightIntro = document.getElementById('lightIntro');

  const THEME_STORAGE_KEY = 'jds-theme-v2';

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

  const finishIntro = () => {
    lightIntro?.classList.add('light-on', 'intro-hidden');
    document.body.classList.add('light-has-switched');
    document.body.classList.remove('intro-active', 'intro-pulling');
  };

  if (lightIntro && introPull) {
    document.body.classList.add('intro-active');
    introPull.setAttribute('aria-disabled', 'false');

    positionIntroSpotlight();
    requestAnimationFrame(positionIntroSpotlight);
    // Re-measure once webfonts/layout settle and on viewport changes.
    window.addEventListener('load', positionIntroSpotlight);
    window.setTimeout(positionIntroSpotlight, 350);
    window.setTimeout(positionIntroSpotlight, 1200);
    window.addEventListener('resize', positionIntroSpotlight, { passive: true });
    window.addEventListener('orientationchange', positionIntroSpotlight);

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
      const turnOn = (event) => {
        event?.preventDefault?.();
        if (switchedOn) return;
        switchedOn = true;
        introPull.setAttribute('aria-disabled', 'true');
        playSwitchSound();
        // 1) Cord tugs down.
        document.body.classList.add('intro-pulling');
        // 2) Bulb + cone come on; the room starts brightening out from the lamp.
        window.setTimeout(() => {
          document.body.classList.add('light-has-switched');
          lightIntro.classList.add('light-on');
        }, 240);
        // 3) The expanding light does most of the reveal; fade out whatever
        //    darkness remains, then unlock the page.
        window.setTimeout(() => lightIntro.classList.add('intro-hidden'), 1500);
        window.setTimeout(() => document.body.classList.remove('intro-active', 'intro-pulling'), 2800);
      };

      introPull.addEventListener('click', turnOn);
      introPull.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') turnOn(e);
      });

      // Failsafe only: do not auto-play quickly, but never leave the page trapped.
      window.setTimeout(() => {
        if (!switchedOn) finishIntro();
      }, 30000);
    }
  } else if (lightIntro) {
    finishIntro();
  }

  const headerIsSolid = header?.classList.contains('solid');
  const updateHeader = () => header?.classList.toggle('scrolled', Boolean(headerIsSolid || window.scrollY > 18));
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

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
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  }, { passive: true });

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

  const setActiveLink = () => {
    let active = null;
    const y = window.scrollY + 170;
    for (const [link, section] of navSections) {
      if (section.offsetTop <= y) active = link;
    }
    navLinks.forEach((link) => link.classList.toggle('active', link === active));
  };
  setActiveLink();
  window.addEventListener('scroll', setActiveLink, { passive: true });

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

    window.addEventListener('pointermove', (event) => {
      tx = event.clientX;
      ty = event.clientY;
      if (blob && !document.body.classList.contains('intro-active')) blob.style.opacity = '.95';
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      if (blob) blob.style.opacity = '0';
    });

    const moveBlob = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      if (blob) {
        blob.style.left = `${cx}px`;
        blob.style.top = `${cy}px`;
      }
      requestAnimationFrame(moveBlob);
    };
    requestAnimationFrame(moveBlob);

    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 8;
        const rotateX = (0.5 - (y / rect.height)) * 8;
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
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
})();
