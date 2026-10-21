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

/* floating mini navbar */
const topbar = $('#topbar'), hero = $('#hero');
const onScroll = () => {
  topbar.classList.toggle('show', scrollY > hero.offsetHeight * 0.75);
  const a = $('#aboutDish');
  if (a) { const r = a.getBoundingClientRect(); a.style.transform = `rotate(${(r.top / innerHeight) * -40}deg)`; }
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* mouse parallax on the hero food */
if (!reduce && matchMedia('(hover: hover)').matches) {
  const layers = $$('[data-depth]', hero);
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l) => { const d = +l.dataset.depth; l.style.translate = `${-x * d}px ${-y * d}px`; });
  });
  hero.addEventListener('pointerleave', () => layers.forEach((l) => (l.style.translate = '')));
}

/* coupon carousel */
const coupons = [
  { img: '#pizza', name: 'Mexicoo Pizza', cal: '78 Calories', price: '$7.90', time: '30 dk.' },
  { img: '#pasta', name: 'Spaghetti Pomodoro', cal: '64 Calories', price: '$6.50', time: '25 dk.' },
  { img: '#gyoza', name: 'Wok Noodles', cal: '52 Calories', price: '$5.90', time: '20 dk.' },
];
let ci = 0;
const body = $('#couponBody');
function showCoupon(i) {
  ci = (i + coupons.length) % coupons.length;
  body.classList.add('swap');
  setTimeout(() => {
    const c = coupons[ci];
    $('#cImg').setAttribute('href', c.img); $('#cName').textContent = c.name; $('#cCal').textContent = c.cal;
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
