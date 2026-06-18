(() => {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const TRANSITION_MS = {
    'to-poker': 920,
    'to-portfolio': 820,
  };

  function isModifiedClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1;
  }

  function directionForLink(anchor) {
    if (!anchor) return '';
    const explicit = anchor.dataset.pokerTransition;
    if (explicit === 'to-poker' || explicit === 'to-portfolio') return explicit;
    if (anchor.classList.contains('portfolio-back')) return 'to-portfolio';

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch (_) {
      return '';
    }

    const path = url.pathname.replace(/\/+$/, '');
    if (path.endsWith('/poker') || path.endsWith('/poker/index.html')) return 'to-poker';
    return '';
  }

  function canHandle(anchor, event) {
    if (!anchor || !anchor.href) return false;
    if ((anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download') || isModifiedClick(event)) return false;
    try {
      const url = new URL(anchor.href, window.location.href);
      return url.origin === window.location.origin;
    } catch (_) {
      return false;
    }
  }

  function makeCard(text, className = '') {
    const card = document.createElement('span');
    card.className = `poker-route-card ${className}`.trim();
    card.textContent = text;
    card.dataset.rank = text;
    return card;
  }

  function makeChip() {
    const chip = document.createElement('span');
    chip.className = 'poker-route-chip';
    return chip;
  }

  function getOverlay() {
    let overlay = document.getElementById('pokerRouteTransition');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'pokerRouteTransition';
    overlay.className = 'poker-route-transition';
    overlay.setAttribute('aria-hidden', 'true');

    const stage = document.createElement('div');
    stage.className = 'poker-route-stage';

    const glow = document.createElement('div');
    glow.className = 'poker-route-glow';

    const table = document.createElement('div');
    table.className = 'poker-route-table';

    const cardLayer = document.createElement('div');
    cardLayer.className = 'poker-route-cards';
    cardLayer.append(makeCard('A♠'), makeCard('K♥', 'red'), makeCard('Q♦', 'red'), makeCard('J♣'));

    const chipLayer = document.createElement('div');
    chipLayer.className = 'poker-route-chips';
    chipLayer.append(makeChip(), makeChip(), makeChip(), makeChip());

    const label = document.createElement('div');
    label.className = 'poker-route-label';
    label.innerHTML = '<span class="label-poker">Dealing you into <strong>Poker</strong>…</span><span class="label-portfolio">Cashing out back to <strong>Portfolio</strong>…</span>';

    stage.append(glow, table, cardLayer, chipLayer, label);
    overlay.append(stage);
    document.body.appendChild(overlay);
    return overlay;
  }

  function runTransition(direction, destination) {
    if (prefersReduced) {
      window.location.assign(destination);
      return;
    }

    const overlay = getOverlay();
    overlay.classList.remove('is-active');
    overlay.dataset.direction = direction;
    document.documentElement.classList.add('route-transition-lock');
    document.body.classList.add('route-transition-lock');
    void overlay.offsetWidth;
    overlay.classList.add('is-active');

    window.setTimeout(() => {
      window.location.assign(destination);
    }, TRANSITION_MS[direction] || 850);
  }

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a');
    const direction = directionForLink(anchor);
    if (!direction || !canHandle(anchor, event)) return;

    event.preventDefault();
    runTransition(direction, anchor.href);
  });
})();
