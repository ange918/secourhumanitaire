/* Cart + demo checkout. No payment is processed and nothing leaves the browser. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => `$${n.toFixed(2)}`;
  const T = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const noMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'fode-cart-v1';
  const DELIVERY = 2.5, FREE_FROM = 20;

  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]').filter((i) => i && i.id && i.qty > 0); } catch (e) { items = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable */ } };

  const cart = $('#cart'), overlay = $('#cartOverlay');
  const views = { cart: $('#viewCart'), pay: $('#viewPay'), done: $('#viewDone') };
  let view = 'cart', lastFocus = null;

  /* ---------- totals ---------- */
  const count = () => items.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => items.reduce((n, i) => n + i.qty * i.price, 0);
  const delivery = () => (items.length === 0 || subtotal() >= FREE_FROM ? 0 : DELIVERY);
  const total = () => subtotal() + delivery();

  /* ---------- render ---------- */
  function render() {
    const n = count();
    $$('[data-cart-count]').forEach((b) => { b.textContent = n; b.hidden = n === 0; });
    $('#cartTitle').textContent = view === 'cart' ? (n ? T('Your cart ({n})', { n }) : T('Your cart')) : view === 'pay' ? T('Checkout title') : T('Thank you title');
    const list = $('#cartList');
    list.innerHTML = items.map((i) => `
      <li class="ci" data-id="${i.id}">
        <img src="assets/noodles.png" width="64" height="64" alt="">
        <div class="ci-info"><b>${T(i.name)}</b><span>${money(i.price)}</span></div>
        <div class="qty" role="group" aria-label="${T('Quantity of {name}', { name: T(i.name) })}">
          <button type="button" data-act="dec" aria-label="${T('Remove one')}">−</button><output>${i.qty}</output><button type="button" data-act="inc" aria-label="${T('Add one')}">+</button>
        </div>
        <b class="ci-total">${money(i.price * i.qty)}</b>
        <button type="button" class="ci-del" data-act="del" aria-label="${T('Remove {name} from cart', { name: T(i.name) })}">×</button>
      </li>`).join('');
    $('#cartEmpty').hidden = items.length > 0;
    $('#cartFoot').hidden = items.length === 0;
    $('#sSub').textContent = money(subtotal());
    $('#sDel').textContent = delivery() === 0 && items.length ? T('Free') : money(delivery());
    $('#sTot').textContent = money(total());
    const left = FREE_FROM - subtotal();
    $('#freeNote').textContent = items.length && left > 0 ? T('Add {x} more for free delivery', { x: money(left) }) : items.length ? T('You get free delivery') : '';
    $('#payLabel').textContent = T('Pay {x}', { x: money(total()) });
  }

  /* ---------- open / close ---------- */
  function setView(v) {
    view = v;
    Object.entries(views).forEach(([k, el]) => { el.hidden = k !== v; });
    $('#cartBack').hidden = v !== 'pay';
    $('#cartClose').hidden = false;
    render();
    cart.scrollTop = 0;
  }
  function open(v = 'cart') {
    lastFocus = document.activeElement;
    setView(v);
    overlay.hidden = false;
    requestAnimationFrame(() => { document.body.classList.add('cart-open'); cart.setAttribute('aria-hidden', 'false'); $('#cartClose').focus(); });
  }
  function close() {
    document.body.classList.remove('cart-open');
    cart.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!document.body.classList.contains('cart-open')) overlay.hidden = true; }, 450);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-open-cart]').forEach((b) => b.addEventListener('click', () => open('cart')));
  overlay.addEventListener('click', close);
  $('#cartClose').addEventListener('click', close);
  $$('[data-close-cart]').forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('cart-open')) close(); });
  $('#cartBack').addEventListener('click', () => setView('cart'));

  /* ---------- add items ---------- */
  function fly(fromEl, imgSrc) {
    if (noMotion || !fromEl) return;
    const target = $$('.cart-btn').find((b) => { const r = b.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight && getComputedStyle(b).visibility !== 'hidden'; });
    if (!target) return;
    const a = fromEl.getBoundingClientRect(), t = target.getBoundingClientRect();
    const g = document.createElement('img');
    g.src = imgSrc; g.alt = ''; g.className = 'fly';
    g.style.cssText = `left:${a.left + a.width / 2 - 28}px;top:${a.top + a.height / 2 - 28}px`;
    document.body.appendChild(g);
    const dx = t.left + t.width / 2 - (a.left + a.width / 2), dy = t.top + t.height / 2 - (a.top + a.height / 2);
    const anim = g.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(.8)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.2)`, opacity: .4 },
    ], { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)' });
    anim.onfinish = () => { g.remove(); bump(); };
  }
  function bump() {
    $$('.cart-btn').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }
  function add(item, from) {
    const found = items.find((i) => i.id === item.id);
    if (found) found.qty += 1; else items.push({ ...item, qty: 1 });
    save(); render(); fly(from, 'assets/noodles.png'); if (noMotion) bump();
    if (window.say) window.say(T('{name} added to your cart', { name: T(item.name) }));
  }
  $('#buy').addEventListener('click', (e) => { add({ id: 'italian-pasta', name: 'Italian Pasta', price: 7.9 }, e.currentTarget); setTimeout(() => open('cart'), noMotion ? 0 : 800); });
  $$('.dish-card .add').forEach((b) => b.addEventListener('click', () => {
    const card = b.closest('.dish-card'), name = card.dataset.name;
    add({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, price: parseFloat(card.querySelector('.row b').textContent.replace('$', '')) }, b);
  }));

  /* ---------- cart list actions ---------- */
  $('#cartList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.closest('.ci').dataset.id, it = items.find((i) => i.id === id); if (!it) return;
    if (b.dataset.act === 'inc') it.qty += 1;
    if (b.dataset.act === 'dec') it.qty -= 1;
    if (b.dataset.act === 'del' || it.qty <= 0) items = items.filter((i) => i.id !== id);
    save(); render();
  });
  $('#toCheckout').addEventListener('click', () => setView('pay'));

  /* ---------- payment form ---------- */
  const f = {
    num: $('#kNum'), exp: $('#kExp'), cvc: $('#kCvc'), zip: $('#pZip'),
  };
  f.num.addEventListener('input', () => { f.num.value = f.num.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); });
  f.exp.addEventListener('input', () => { let v = f.exp.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`; f.exp.value = v; });
  f.cvc.addEventListener('input', () => { f.cvc.value = f.cvc.value.replace(/\D/g, '').slice(0, 4); });
  $$('input[name="pm"]').forEach((r) => r.addEventListener('change', () => {
    $$('.pm label').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
    $('#cardFields').hidden = r.value !== 'card' || !r.checked;
  }));

  function validate() {
    const bad = [];
    const need = ['pName', 'pPhone', 'pAddr', 'pCity', 'pZip'];
    need.forEach((id) => { const el = $('#' + id); const ok = el.value.trim().length > 1; el.classList.toggle('bad', !ok); if (!ok) bad.push(el); });
    const em = $('#pEmail'); const okE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim()); em.classList.toggle('bad', !okE); if (!okE) bad.push(em);
    if ($('input[name="pm"]:checked').value === 'card') {
      const n = f.num.value.replace(/\s/g, ''), okN = n.length === 16; f.num.classList.toggle('bad', !okN); if (!okN) bad.push(f.num);
      const nm = $('#kName'); const okM = nm.value.trim().length > 2; nm.classList.toggle('bad', !okM); if (!okM) bad.push(nm);
      const m = /^(\d{2})\/(\d{2})$/.exec(f.exp.value); const okX = !!m && +m[1] >= 1 && +m[1] <= 12; f.exp.classList.toggle('bad', !okX); if (!okX) bad.push(f.exp);
      const okC = f.cvc.value.length >= 3; f.cvc.classList.toggle('bad', !okC); if (!okC) bad.push(f.cvc);
    }
    return bad;
  }
  $('#payForm').addEventListener('input', (e) => e.target.classList.remove('bad'));
  $('#payForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('#payErr'), bad = validate();
    if (bad.length) { err.textContent = T('Please check the highlighted fields.'); err.hidden = false; bad[0].focus(); return; }
    err.hidden = true;
    const btn = $('#payBtn'); btn.disabled = true; btn.classList.add('busy'); $('#payLabel').textContent = T('Processing…');
    setTimeout(() => {
      const num = `FD-${Math.floor(10000 + Math.random() * 89999)}`;
      $('#dName').textContent = $('#pName').value.trim().split(' ')[0];
      $('#dNum').textContent = `#${num}`;
      $('#dTot').textContent = money(total());
      $('#dAddr').textContent = `${$('#pAddr').value.trim()}, ${$('#pCity').value.trim()}`;
      items = []; save();
      btn.disabled = false; btn.classList.remove('busy');
      e.target.reset(); $('#cardFields').hidden = false; $$('.pm label').forEach((l, i) => l.classList.toggle('on', i === 0));
      setView('done');
    }, noMotion ? 100 : 1700);
  });
  $('#doneBtn').addEventListener('click', close);

  render();
  if (window.I18N) I18N.onChange(render);
})();
