export function initProjectCarousel() {
  const carousel = document.querySelector('[data-project-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('[data-carousel-track]');
  const slides = [...track.querySelectorAll('.project-card')];
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const status = carousel.querySelector('[data-carousel-status]');
  const dotList = carousel.querySelector('[data-carousel-dots]');
  let dots = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let scrollTimer = 0;

  carousel.classList.add('is-carousel');
  carousel.setAttribute('aria-roledescription', 'carousel');
  track.tabIndex = 0;
  carousel.querySelector('[data-carousel-controls]').hidden = false;
  slides.forEach((slide, index) => {
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`);
  });

  // Measure from the content edge so borders and responsive gaps stay aligned.
  const visibleCount = () => Math.min(slides.length,
    Number(getComputedStyle(track).getPropertyValue('--carousel-columns')) || 1);
  const maxIndex = () => Math.max(0, slides.length - visibleCount());
  const position = (slide) => Math.min(slide.offsetLeft - slides[0].offsetLeft, track.scrollWidth - track.clientWidth);

  // One dot per scroll position: 3 across 5 cards gives 3 dots, 1 across gives 5.
  function buildDots() {
    if (dots.length === maxIndex() + 1) return;
    dotList.replaceChildren();
    dots = Array.from({ length: maxIndex() + 1 }, (_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-controls', 'project-track');
      dot.addEventListener('click', () => goTo(index));
      dotList.append(dot);
      return dot;
    });
  }

  function update(index) {
    current = index;
    previous.disabled = current === 0;
    next.disabled = current === maxIndex();
    const last = current + visibleCount();
    const label = (index) => visibleCount() === 1
      ? `Project ${index + 1} of ${slides.length}`
      : `Projects ${index + 1}-${index + visibleCount()} of ${slides.length}`;
    status.textContent = label(current);
    dots.forEach((dot, index) => {
      dot.setAttribute('aria-label', `Show ${label(index).toLowerCase()}`);
      if (index === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    slides.forEach((slide, index) => {
      // Keep links in clipped slides out of the keyboard and screen-reader flow.
      // During a swipe, preserve a focused slide until focus leaves it.
      slide.inert = (index < current || index >= last) && !slide.contains(document.activeElement);
    });
  }

  function goTo(index, instant = false) {
    const target = Math.max(0, Math.min(index, maxIndex()));
    if (target === current && Math.abs(track.scrollLeft - position(slides[target])) < 1) return;
    window.clearTimeout(scrollTimer);
    if (slides.some((slide, index) => (index < target || index >= target + visibleCount()) && slide.contains(document.activeElement))) {
      track.focus({ preventScroll: true });
    }
    update(target);
    track.scrollTo({
      left: position(slides[target]),
      behavior: instant || reducedMotion.matches ? 'instant' : 'smooth'
    });
  }

  function syncFromScroll() {
    const nearest = slides.slice(0, maxIndex() + 1).reduce((best, slide, index) =>
      Math.abs(position(slide) - track.scrollLeft) < Math.abs(position(slides[best]) - track.scrollLeft) ? index : best, 0);
    update(nearest);
  }

  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  track.addEventListener('scroll', () => {
    // Settle once after a swipe or animation. Updating at every intermediate
    // slide would change the next-click target during smooth navigation.
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(syncFromScroll, 100);
  }, { passive: true });
  track.addEventListener('focusout', () => requestAnimationFrame(() => update(current)));
  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    const targets = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: maxIndex() };
    if (!(event.key in targets)) return;
    event.preventDefault();
    goTo(targets[event.key]);
  });
  new ResizeObserver(() => {
    buildDots();
    update(Math.min(current, maxIndex()));
    track.scrollTo({ left: position(slides[current]), behavior: 'instant' });
  }).observe(track);
  buildDots();
  update(0);
}
