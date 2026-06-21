import { prefersReduced } from './shared.js';

export function initEffects() {
  if (prefersReduced || !window.matchMedia('(pointer:fine)').matches) return;

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
