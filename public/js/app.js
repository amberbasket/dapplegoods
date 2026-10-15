// Dapple Goods storefront: cart drawer, cart page, checkout, small UI bits.
(function () {
  const KEY = 'dg_cart';
  const S = window.SHIPPING || { freeOver: 59, flat: 9.95 };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = (n) => '$' + Number(n).toFixed(2);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const save = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} render(); };
  let cart = load();

  const subtotal = () => cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = () => (cart.length === 0 ? 0 : subtotal() >= S.freeOver ? 0 : S.flat);

  function add(item, qty) {
    const found = cart.find((i) => i.id === item.id);
    if (found) found.qty = Math.min(99, found.qty + qty);
    else cart.push({ ...item, qty });
    save(cart);
    toast(`Added to your bag: ${item.name}`);
  }
  function setQty(id, qty) {
    cart = cart.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i));
    save(cart);
  }
  function remove(id) {
    cart = cart.filter((i) => i.id !== id);
    save(cart);
  }

  function lineHtml(i, editable) {
    return `<div class="line">
      <img src="${esc(i.image || '/img/placeholder.svg')}" alt="" onerror="this.onerror=null;this.src='/img/placeholder.svg'">
      <div><a href="/product/${esc(i.slug)}">${esc(i.name)}</a><div class="muted small">${i.brand ? `${esc(i.brand)} · ` : ''}${money(i.price)}</div>
      ${editable ? `<div><span class="qty"><button data-dec="${esc(i.id)}" aria-label="Decrease">−</button><input value="${i.qty}" data-set="${esc(i.id)}" aria-label="Quantity"><button data-inc="${esc(i.id)}" aria-label="Increase">+</button></span><button class="remove" data-remove="${esc(i.id)}">Remove</button></div>` : `<div class="muted small">Qty ${i.qty}</div>`}
      </div>
      <strong>${money(i.price * i.qty)}</strong>
    </div>`;
  }

  function render() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    $$('[data-cart-count]').forEach((el) => { el.textContent = count; el.style.display = count ? '' : 'none'; });
    $$('[data-cart-subtotal]').forEach((el) => (el.textContent = money(subtotal())));
    $$('[data-cart-shipping]').forEach((el) => (el.textContent = cart.length ? (shipping() ? money(shipping()) : 'Free') : '—'));
    $$('[data-cart-total]').forEach((el) => (el.textContent = money(subtotal() + shipping())));
    const empty = '<div class="empty-cart"><p class="kicker">Your bag is empty</p><p>Let’s find something to squeak about.</p><a href="/shop" class="btn btn-primary">Start Shopping</a></div>';
    const list = cart.length ? cart.map((i) => lineHtml(i, true)).join('') : empty;
    $$('[data-cart-items], [data-cart-page]').forEach((el) => (el.innerHTML = list));
    $$('[data-checkout-items]').forEach((el) => (el.innerHTML = cart.map((i) => lineHtml(i, false)).join('') || '<p class="muted">Your bag is empty.</p>'));
    const meter = $('[data-ship-meter]');
    if (meter) {
      const left = S.freeOver - subtotal();
      const pct = Math.min(100, (subtotal() / S.freeOver) * 100);
      meter.innerHTML = (left > 0 ? `You're <strong>${money(left)}</strong> away from free shipping` : '<strong>You’ve earned free shipping!</strong>') + `<div class="meter"><span style="width:${pct}%"></span></div>`;
    }
  }

  // Refresh names/prices/stock from the server so stale carts stay honest.
  function refresh() {
    if (!cart.length) return render();
    fetch('/api/products?ids=' + cart.map((i) => i.id).join(','))
      .then((r) => r.json())
      .then((live) => {
        cart = cart.filter((i) => live.some((p) => p.id === i.id)).map((i) => ({ ...i, ...live.find((p) => p.id === i.id), qty: i.qty }));
        save(cart);
      })
      .catch(render);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('.toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  const openCart = () => { document.body.classList.add('cart-open'); $('.cart-drawer').setAttribute('aria-hidden', 'false'); };
  const closeCart = () => { document.body.classList.remove('cart-open'); $('.cart-drawer').setAttribute('aria-hidden', 'true'); };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.matches('[data-add]')) {
      const qtyInput = t.hasAttribute('data-use-qty') && $('[data-qty-input]');
      const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      add({ id: t.dataset.add, name: t.dataset.name, price: Number(t.dataset.price), image: t.dataset.image, slug: t.dataset.slug, brand: t.dataset.brand }, qty);
      if (!$('[data-cart-page]') && !$('[data-checkout]')) openCart();
    } else if (t.matches('[data-open-cart]')) openCart();
    else if (t.matches('[data-close-cart]')) closeCart();
    else if (t.matches('[data-inc]')) { const i = cart.find((x) => x.id === t.dataset.inc); setQty(i.id, i.qty + 1); }
    else if (t.matches('[data-dec]')) { const i = cart.find((x) => x.id === t.dataset.dec); setQty(i.id, i.qty - 1); }
    else if (t.matches('[data-remove]')) remove(t.dataset.remove);
    else if (t.matches('[data-qty]')) {
      const input = $('[data-qty-input]');
      input.value = Math.max(1, Math.min(Number(input.max) || 99, (parseInt(input.value, 10) || 1) + Number(t.dataset.qty)));
    } else if (t.matches('[data-thumb]')) {
      $('[data-main-img]').src = t.dataset.thumb;
      $$('[data-thumb]').forEach((b) => b.classList.toggle('on', b === t));
    } else if (t.matches('.nav-toggle')) {
      const open = document.body.classList.toggle('nav-open');
      t.setAttribute('aria-expanded', open);
    }
  });
  $('.drawer-backdrop')?.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-set]')) setQty(e.target.dataset.set, parseInt(e.target.value, 10) || 1);
  });

  $$('[data-newsletter]').forEach((f) =>
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = f.querySelector('input').value;
      try {
        const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        if (!r.ok) throw new Error((await r.json()).error);
        f.innerHTML = '<p class="news-thanks">Thank you! You’re on the list.</p>';
      } catch (ex) {
        toast(ex.message || 'Something went wrong. Please try again.');
      }
    })
  );

  const form = $('[data-checkout]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('[data-error]');
      err.textContent = '';
      if (!cart.length) { err.textContent = 'Your bag is empty.'; return; }
      const fd = new FormData(form);
      const customer = {};
      ['email', 'phone', 'firstName', 'lastName', 'address', 'address2', 'city', 'region', 'postal'].forEach((k) => (customer[k] = fd.get(k) || ''));
      customer.giftNote = fd.get('giftNote') || '';
      const btn = $('[data-submit]');
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = 'Processing…';
      try {
        const r = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart.map(({ id, qty }) => ({ id, qty })), customer }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Something went wrong.');
        location.href = j.redirect;
      } catch (ex) {
        err.textContent = ex.message;
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }

  refresh();
})();
