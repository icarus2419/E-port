(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('primaryNav');
  const menuToggle = document.getElementById('menuToggle');
  const themeToggle = document.getElementById('themeToggle');
  const loadScreen = document.getElementById('loadScreen');

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

  window.addEventListener('load', () => {
    window.setTimeout(() => loadScreen?.classList.add('hidden'), prefersReduced ? 0 : 700);
  });

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
      if (blob) blob.style.opacity = '.95';
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
