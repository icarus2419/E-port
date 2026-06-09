const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

window.addEventListener('load', () => {
  setTimeout(() => $('#loader')?.classList.add('hide'), 650);
});

const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

const menuToggle = $('#menuToggle');
const nav = $('#nav');
menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('.nav a').forEach(link => link.addEventListener('click', () => nav?.classList.remove('open')));

const cursor = $('#cursor');
if (cursor && matchMedia('(pointer:fine)').matches) {
  window.addEventListener('mousemove', e => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  });
  $$('a, button, .tilt-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.13, rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach(el => io.observe(el));

$$('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - .5;
    const y = (e.clientY - rect.top) / rect.height - .5;
    card.style.transform = `translate(-3px, -3px) rotateX(${y * -4}deg) rotateY(${x * 5}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

window.pokerDemo = function pokerDemo(){
  const log = $('#pokerLog');
  if(!log) return;
  const lines = ['Creating room...', 'Dealing A♠ K♥...', 'AI Easy checks.', 'Joseph raises.', 'WebSocket state pushed.', 'Demo complete.'];
  let i = 0;
  log.textContent = lines[0];
  const t = setInterval(() => {
    i++;
    log.textContent = lines[i] || lines[lines.length - 1];
    if (i >= lines.length - 1) clearInterval(t);
  }, 520);
};
