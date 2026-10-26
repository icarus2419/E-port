const profileSummary = document.querySelector('#portfolio-summary');

// Keep profile navigation separate from the scene's window-level controls.
// Keyup still reaches the scene so previously held driving keys can reset.
profileSummary?.addEventListener('keydown', (event) => event.stopPropagation());
profileSummary?.addEventListener('pointerdown', (event) => event.stopPropagation());
