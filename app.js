const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* hero entrance on every page load/refresh */
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));

/* reveal on scroll */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal]').forEach((el) => io.observe(el));

/* count-up numbers */
const cio = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - k, 3));
      el.textContent = v.toFixed(dec);
      if (k < 1) requestAnimationFrame(tick);
    };
    reduce ? (el.textContent = end.toFixed(dec)) : requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => cio.observe(el));

/* split section titles into words (masked slide-up on reveal) */
$$('.title').forEach((t) => {
  let n = 0;
  const wrap = (txt) => txt.split(/(\s+)/).map((w) => (/^\s+$/.test(w) || !w ? w : `<span class="w"><span style="--i:${n++}">${w}</span></span>`)).join('');
  t.innerHTML = [...t.childNodes].map((c) => (c.nodeType === 3 ? wrap(c.textContent) : `<b>${wrap(c.textContent)}</b>`)).join('');
  t.classList.add('split');
});

/* ---- one scroll/animation loop: progress bar, mini navbar, hero scroll-out, parallax, marquee, steps ---- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const topbar = $('#topbar'), hero = $('#hero'), progress = $('#progress'), track = $('#track');
const stepsEl = $('#steps'), stepLine = $('#stepLine'), steps = $$('.step');
const aboutDish = $('#aboutDish'), copy = $('.copy', hero), dark = $('.dark', hero);
const fine = !reduce && matchMedia('(hover: hover)').matches;

// hero layers: [element, mouse depth, scroll motion (x, y, rotate°, scale)]
const L = (sel, depth, sx, sy, sr, ss) => ({ el: $(sel, hero), depth, sx, sy, sr, ss, mx: 0, my: 0 });
const layers = [
  L('.dish-wrap', 14, 70, 130, 28, -0.14), L('.leaf-a', 26, -90, 190, 70, 0), L('.leaf-b', 22, 60, 230, -80, 0),
  L('.tomato', 34, -50, 260, 0, 0), L('.garlic', 30, -70, 170, 50, 0), L('.napkin', -10, -40, 80, 0, 0), L('.leaf-bl', -14, 30, -60, 25, 0),
].filter((l) => l.el);
let mouse = { x: 0, y: 0 }, mouseT = { x: 0, y: 0 };
if (fine) {
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    mouseT.x = (e.clientX - r.left) / r.width - 0.5; mouseT.y = (e.clientY - r.top) / r.height - 0.5;
  });
  hero.addEventListener('pointerleave', () => { mouseT.x = 0; mouseT.y = 0; });
}

const speedEls = $$('[data-speed]'), picEls = $$('.dish-card .pic img, .dish-card .pic svg');
let lastY = scrollY, vel = 0, mx = 0, dir = 1;
function frame() {
  const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
  vel += ((y - lastY) - vel) * 0.12; lastY = y;
  if (Math.abs(vel) > 0.2) dir = vel > 0 ? 1 : -1;

  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  topbar.classList.toggle('show', y > hero.offsetHeight * 0.75);

  // hero scroll-out
  const hp = reduce ? 0 : clamp(y / (hero.offsetHeight * 0.9));
  mouse.x += (mouseT.x - mouse.x) * 0.08; mouse.y += (mouseT.y - mouse.y) * 0.08;
  layers.forEach((l) => {
    l.el.style.translate = `${-mouse.x * l.depth + hp * l.sx}px ${-mouse.y * l.depth + hp * l.sy}px`;
    l.el.style.rotate = l.sr ? `${hp * l.sr}deg` : '';
    l.el.style.scale = l.ss ? String(1 + hp * l.ss) : '';
  });
  if (!reduce) {
    copy.style.translate = `0 ${hp * -70}px`; copy.style.opacity = String(1 - hp * 1.1);
    dark.style.translate = `${hp * 6}% 0`;
  }

  // generic parallax (relative to viewport centre)
  if (!reduce) {
    speedEls.forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; el.style.translate = `0 ${(r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed)}px`; });
    picEls.forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; el.style.translate = `0 ${(r.top + r.height / 2 - vh / 2) * -0.05}px`; });
    if (aboutDish) { const r = aboutDish.getBoundingClientRect(); aboutDish.style.rotate = `${(r.top / vh) * -50}deg`; aboutDish.style.scale = String(0.85 + clamp(1 - Math.abs(r.top + r.height / 2 - vh / 2) / vh) * 0.2); }
  }

  // marquee: constant drift, pushed by scroll speed and direction
  if (track && !reduce) {
    mx -= dir * (0.7 + Math.min(Math.abs(vel), 40) * 0.5);
    const half = track.scrollWidth / 2;
    if (mx <= -half) mx += half; if (mx > 0) mx -= half;
    track.style.transform = `translateX(${mx}px)`;
  }

  // steps line draws with scroll
  if (stepsEl) {
    const r = stepsEl.getBoundingClientRect(), p = clamp((vh * 0.8 - r.top) / (r.height * 0.9 + vh * 0.2));
    stepLine.style.transform = `scaleX(${p})`;
    steps.forEach((s, i) => s.classList.toggle('on', p > 0.12 + i * 0.36));
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* coupon carousel */
const coupons = [
  { name: 'Mexicoo Pizza', cal: '78 Calories', price: '$7.90', time: '30 dk.' },
  { name: 'Spaghetti Pomodoro', cal: '64 Calories', price: '$6.50', time: '25 dk.' },
  { name: 'Wok Noodles', cal: '52 Calories', price: '$5.90', time: '20 dk.' },
];
let ci = 0;
const body = $('#couponBody');
function showCoupon(i) {
  ci = (i + coupons.length) % coupons.length;
  body.classList.add('swap');
  setTimeout(() => {
    const c = coupons[ci];
    $('#cName').textContent = c.name; $('#cCal').textContent = c.cal;
    $('#cPrice').textContent = c.price; $('#cTime').textContent = c.time;
    body.classList.remove('swap');
  }, 230);
}
$('#next').addEventListener('click', () => showCoupon(ci + 1));
$('#prev').addEventListener('click', () => showCoupon(ci - 1));
setInterval(() => { if (!document.hidden && !reduce) showCoupon(ci + 1); }, 6000);

/* menu filter */
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
  $$('.dish-card').forEach((c) => {
    const show = b.dataset.f === 'all' || c.dataset.c === b.dataset.f;
    c.classList.toggle('hide', !show);
    if (show) { c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); }
  });
});

/* toast / buy / forms */
const toast = $('#toast');
let tt;
function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); }
$('#buy').addEventListener('click', () => say('Italian Pasta added to your cart 🍝'));
$$('.add').forEach((b) => b.addEventListener('click', () => say(`${b.closest('.dish-card').querySelector('h3').textContent} added to your cart`)));
$('#signup').addEventListener('submit', (e) => { e.preventDefault(); $('#ok').hidden = false; e.target.reset(); });
$('#burger').addEventListener('click', () => say('Menu: Why Fode? · About · Menu'));
