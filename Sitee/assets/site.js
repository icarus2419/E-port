(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('nav');

  // Page reload/load animation, matching the live site's dark flash + thin top loader + staged hero reveal.
  const runInitialLoadAnimation = () => {
    const html = document.documentElement;
    if (prefersReducedMotion) {
      html.classList.remove('page-loading');
      return;
    }

    const vignette = document.createElement('div');
    vignette.className = 'jds-load-vignette';
    const line = document.createElement('div');
    line.className = 'jds-load-line';
    document.body.append(vignette, line);

    requestAnimationFrame(() => {
      window.setTimeout(() => html.classList.remove('page-loading'), 60);
    });

    window.setTimeout(() => {
      vignette.remove();
      line.remove();
      html.classList.remove('page-loading');
    }, 1150);
  };
  runInitialLoadAnimation();


  const updateNav = () => {
    if (!nav) return;
    nav.classList.toggle('nav-scrolled', window.scrollY > 20);
  };
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  // Mouse/ambient glow, close to the live Chariot-style motion.
  if (!prefersReducedMotion && !window.matchMedia('(max-width: 768px)').matches) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      glow.style.opacity = '.2';
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      glow.style.opacity = '0';
    });

    const animateGlow = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      glow.style.left = `${currentX}px`;
      glow.style.top = `${currentY}px`;
      requestAnimationFrame(animateGlow);
    };
    requestAnimationFrame(animateGlow);
  }

  // Mobile menu recreated because the saved HTML only captured the closed React state.
  const button = document.getElementById('mobile-menu-button') || document.querySelector('button.md\\:hidden');
  if (button && nav) {
    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.setAttribute('aria-label', 'Mobile navigation');
    const links = [...nav.querySelectorAll('.hidden.md\\:flex a')].filter(a => a.textContent.trim());
    const closeMenu = () => {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    };
    links.slice(0, 6).forEach(a => {
      const clone = a.cloneNode(true);
      clone.removeAttribute('class');
      clone.addEventListener('click', closeMenu);
      menu.appendChild(clone);
    });
    document.body.appendChild(menu);
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !button.contains(e.target)) closeMenu();
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  // Smooth local anchors.
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }
    });
  });

  // Active nav link while scrolling.
  const navLinks = nav ? [...nav.querySelectorAll('a[href^="#"]')].filter(a => /^#\w+/.test(a.getAttribute('href') || '')) : [];
  const sectionMap = navLinks
    .map(link => [link, document.querySelector(link.getAttribute('href'))])
    .filter(([, section]) => section);

  const updateActiveLink = () => {
    let current = sectionMap[0]?.[0];
    const fromTop = window.scrollY + 140;
    for (const [link, section] of sectionMap) {
      if (section.offsetTop <= fromTop) current = link;
    }
    navLinks.forEach(link => link.classList.toggle('nav-active', link === current));
  };
  updateActiveLink();
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // Recreate Framer Motion-style hero entrance.
  const heroItems = [
    ...document.querySelectorAll('main section:first-of-type .max-w-4xl > div, main section:first-of-type h1, main section:first-of-type p, main section:first-of-type .flex.flex-col.sm\\:flex-row')
  ];
  heroItems.forEach((el, index) => {
    if (prefersReducedMotion) return;
    el.classList.add('hero-motion');
    el.style.transitionDelay = `${index * 115 + 90}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('motion-in')));
  });

  // Recreate saved Framer reveal states instead of forcing them visible instantly.
  const savedMotionEls = [...document.querySelectorAll('#root [style*="opacity: 0"]')].filter(el => {
    const s = el.getAttribute('style') || '';
    return !s.includes('opacity: 0.1') && !el.closest('nav') && !heroItems.includes(el);
  });

  const additionalRevealEls = [
    ...document.querySelectorAll('#projects .grid > div, #skills .grid > div, #experience .space-y-12 > div, #contact .grid > div')
  ].filter(el => !savedMotionEls.includes(el));

  const allRevealEls = [...savedMotionEls, ...additionalRevealEls];

  if (prefersReducedMotion) {
    allRevealEls.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
  } else {
    const revealElement = (el, activeObserver) => {
      el.classList.add('motion-in');
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
      activeObserver.unobserve(el);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target, observer);
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -8% 0px' });

    // The second experience item looked a touch late compared with the live site/video.
    // Give only that item an earlier viewport trigger and a shorter delay.
    const earlyExperienceObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target, earlyExperienceObserver);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px 8% 0px' });

    const secondExperienceItem = document.querySelector('#experience .space-y-12 > div:nth-child(2)');

    allRevealEls.forEach((el, index) => {
      const inline = el.getAttribute('style') || '';
      el.classList.add('motion-prep');
      if (/translateX\(-/.test(inline)) el.classList.add('from-left');
      else if (/translateX\(/.test(inline)) el.classList.add('from-right');
      else el.classList.add('from-up');

      const isSecondExperienceItem = el === secondExperienceItem;
      el.style.transitionDelay = isSecondExperienceItem
        ? '25ms'
        : `${Math.min(index % 6, 5) * 90}ms`;

      (isSecondExperienceItem ? earlyExperienceObserver : observer).observe(el);
    });
  }

  // Card tilt + glow: close to the original hover feel, but safe for static HTML.
  const cards = [
    ...document.querySelectorAll('#projects .grid > div, #skills .grid > div, #contact a')
  ];
  cards.forEach(card => {
    card.classList.add(card.closest('#skills') ? 'skill-card' : 'project-card');
    if (prefersReducedMotion) return;
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 7;
      const rotateX = ((0.5 - (y / rect.height)) * 7);
      card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  // Subtle floating code blocks.
  const codeSnippets = [...document.querySelectorAll('main section:first-of-type .font-mono')];
  if (!prefersReducedMotion) {
    codeSnippets.forEach((snippet, index) => {
      snippet.animate([
        { transform: 'translateY(0px)', opacity: .08 },
        { transform: `translateY(${index % 2 ? -12 : 12}px)`, opacity: .14 },
        { transform: 'translateY(0px)', opacity: .08 }
      ], {
        duration: index % 2 ? 6000 : 7000,
        iterations: Infinity,
        easing: 'ease-in-out'
      });
    });
  }

  // Static contact form fallback.
  const form = document.querySelector('form');
  if (form) {
    const msg = document.createElement('p');
    msg.className = 'form-message';
    msg.textContent = 'Opening your email app so the message can be sent.';
    form.appendChild(msg);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name') || '';
      const email = data.get('email') || '';
      const message = data.get('message') || '';
      const subject = encodeURIComponent('Portfolio contact from ' + name);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      msg.classList.add('show');
      window.location.href = `mailto:Josephsamadi2419@gmail.com?subject=${subject}&body=${body}`;
    });
  }
})();
