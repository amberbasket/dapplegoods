// Minimal password-protected admin for loading real products and viewing orders.
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./store');
const { esc, money } = require('./views');

const router = express.Router();

function auth(req, res, next) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return res.status(503).send(page('Admin disabled', '<p>Set the <code>ADMIN_PASSWORD</code> environment variable to enable the shop admin.</p>'));
  const [, b64] = (req.headers.authorization || '').split(' ');
  const [, given] = Buffer.from(b64 || '', 'base64').toString().split(':');
  const ok = given && given.length === pass.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(pass));
  if (ok) return next();
  res.set('WWW-Authenticate', 'Basic realm="Dapple Goods admin"').status(401).send('Login required');
}

router.use(auth);

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Dapple Goods Admin</title><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=DM+Sans:opsz,wght@9..40,400;9..40,700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/css/style.css"></head>
<body class="admin"><header class="admin-head"><div class="container admin-head-inner"><a href="/admin" class="brand-name">Dapple Goods Admin</a>
<nav><a href="/admin">Products</a><a href="/admin/orders">Orders</a><a href="/admin/messages">Messages</a><a href="/admin/subscribers">Subscribers</a><a href="/admin/product/new">+ New product</a><a href="/" target="_blank">View shop ↗</a></nav></div></header>
<main class="container section">${body}</main></body></html>`;
}

router.get('/', (req, res) => {
  const rows = store
    .allProducts()
    .map(
      (p) => `<tr><td><img src="${esc(p.image || '/img/placeholder.svg')}" alt="" width="48" height="48" onerror="this.onerror=null;this.src='/img/placeholder.svg'"></td><td><a href="/admin/product/${p.id}">${esc(p.name)}</a></td><td>${p.brand ? esc(p.brand) : '<span class="ph">needs brand</span>'}</td>
      <td>${esc(store.CATEGORIES.find((c) => c.slug === p.category)?.name || p.category)}</td><td>${typeof p.price === 'number' ? money(p.price) : 'On request'}</td><td>${p.stock}</td><td>${p.draft ? '<span class="pill">Draft</span>' : 'Live'}</td>
      <td><form method="post" action="/admin/product/${p.id}/delete" onsubmit="return confirm('Delete ${esc(p.name).replace(/'/g, '')}?')"><button class="link-btn">Delete</button></form></td></tr>`
    )
    .join('');
  const missing = store.allProducts().filter((p) => !p.draft && !p.brand).length;
  const drafts = store.allProducts().filter((p) => p.draft).length;
  res.send(page('Products', `${missing ? `<div class="notice">${missing} product${missing === 1 ? ' is' : 's are'} missing a brand.</div>` : ''}${drafts ? `<div class="notice">${drafts} draft${drafts === 1 ? ' is' : 's are'} hidden from the shop until you add a photo and price and untick Draft.</div>` : ''}<div class="section-head"><h1>Products (${store.allProducts().length})</h1><a class="btn btn-primary" href="/admin/product/new">Add product</a></div>
    <table class="admin-table"><thead><tr><th></th><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`));
});

router.get('/product/:id', (req, res) => {
  const p = req.params.id === 'new' ? { tags: [], details: [], stock: 1 } : store.anyProduct(req.params.id);
  if (!p) return res.redirect('/admin');
  const opt = (v, label, cur) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(label)}</option>`;
  const tagBoxes = store.COLLECTIONS.map((c) => `<label class="check"><input type="checkbox" name="tags" value="${c.slug}" ${p.tags?.includes(c.slug) ? 'checked' : ''}> ${esc(c.name)}</label>`).join('');
  res.send(page(p.name || 'New product', `<h1>${esc(p.name || 'New product')}</h1>
  <form method="post" action="/admin/product/${p.id || 'new'}" class="admin-form">
    <label class="field"><span>Name</span><input name="name" required value="${esc(p.name)}"></label>
    <div class="two">
      <label class="field"><span>Brand</span><input name="brand" value="${esc(p.brand || '')}" placeholder="e.g. KONG, or Dapple Goods for our own line"></label>
      <label class="field"><span>Supplier / SKU (private, not shown on the site)</span><input name="sku" value="${esc(p.sku || '')}"></label>
    </div>
    <div class="three">
      <label class="field"><span>Category</span><select name="category">${store.CATEGORIES.map((c) => opt(c.slug, c.name, p.category)).join('')}</select></label>
      <label class="field"><span>Price</span><input name="price" type="number" step="0.01" min="0" value="${esc(p.price ?? '')}" placeholder="Blank = price on request"></label>
      <label class="field"><span>Compare-at price (for sales)</span><input name="compareAt" type="number" step="0.01" min="0" value="${esc(p.compareAt || '')}"></label>
    </div>
    <div class="two">
      <label class="field"><span>Stock</span><input name="stock" type="number" min="0" value="${esc(p.stock)}"></label>
      <label class="field"><span>Image URL</span><input name="image" data-image-field value="${esc(p.image)}"></label>
    </div>
    <div class="upload"><img data-image-preview src="${esc(p.image || '')}" alt="" width="120"><label class="btn btn-outline">Upload photo<input type="file" accept="image/*" data-upload hidden></label></div>
    <label class="field"><span>More photo URLs (one per line)</span><textarea name="images" rows="2">${esc((p.images || []).join('\n'))}</textarea></label>
    <label class="field"><span>Description</span><textarea name="description" rows="4">${esc(p.description)}</textarea></label>
    <label class="field"><span>Details (one per line)</span><textarea name="details" rows="4">${esc((p.details || []).join('\n'))}</textarea></label>
    <fieldset><legend>Collections</legend>${tagBoxes}</fieldset>
    <label class="check"><input type="checkbox" name="draft" value="1" ${p.draft ? 'checked' : ''}> Draft (hidden from the shop)</label>
    <label class="field"><span>Source listing (private, not shown on the site)</span><input name="sourceUrl" value="${esc(p.sourceUrl || '')}"></label>
    <button class="btn btn-primary">Save product</button>
  </form>
  <script>
  document.querySelector('[data-upload]').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = await fetch('/admin/upload?name=' + encodeURIComponent(f.name), { method: 'POST', headers: { 'Content-Type': f.type }, body: f });
    const j = await r.json(); if (!r.ok) return alert(j.error);
    document.querySelector('[data-image-field]').value = j.url; document.querySelector('[data-image-preview]').src = j.url;
  });
  </script>`));
});

const { slugify } = store;

router.post('/product/:id', express.urlencoded({ extended: true }), (req, res) => {
  const b = req.body;
  const existing = req.params.id !== 'new' && store.anyProduct(req.params.id);
  let slug = slugify(b.name || 'product');
  if (store.allProducts().some((p) => p.slug === slug && p.id !== existing?.id)) slug += '-' + Date.now().toString(36);
  const saved = store.saveProduct({
    ...(existing ? { id: existing.id } : {}),
    name: b.name,
    slug,
    category: b.category,
    price: b.price === '' || b.price == null ? null : Number(b.price),
    draft: b.draft === '1',
    compareAt: Number(b.compareAt) || null,
    stock: parseInt(b.stock, 10) || 0,
    image: b.image || '',
    images: String(b.images || '').split('\n').map((s) => s.trim()).filter(Boolean),
    brand: String(b.brand || '').trim() || null,
    sku: String(b.sku || '').trim() || null,
    sourceUrl: String(b.sourceUrl || '').trim() || null,
    description: b.description || '',
    details: String(b.details || '').split('\n').map((s) => s.trim()).filter(Boolean),
    tags: [].concat(b.tags || []),
    editedAt: new Date().toISOString(),
  });
  res.redirect(`/admin/product/${saved.id}`);
});

router.post('/product/:id/delete', (req, res) => {
  store.deleteProduct(req.params.id);
  res.redirect('/admin');
});

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };
router.post('/upload', express.raw({ type: 'image/*', limit: '12mb' }), (req, res) => {
  const ext = EXT[req.headers['content-type']];
  if (!ext || !req.body?.length) return res.status(400).json({ error: 'Please upload a JPG, PNG, WebP, GIF or AVIF image.' });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(store.UPLOADS_DIR, name), req.body);
  res.json({ url: `/uploads/${name}` });
});

router.get('/orders', (req, res) => {
  const rows = store
    .orders()
    .map((o) => `<tr><td>${esc(o.id)}</td><td>${esc(new Date(o.createdAt).toLocaleString())}</td><td>${esc(o.customer.firstName)} ${esc(o.customer.lastName)}<br><small>${esc(o.customer.email)}</small></td>
      <td>${o.items.map((i) => `${esc(i.name)}${i.brand ? ` <small>(${esc(i.brand)})</small>` : ''} × ${i.qty}`).join("<br>")}${o.customer.giftNote ? `<br><small>Note: ${esc(o.customer.giftNote)}</small>` : ""}</td><td>${money(o.total)}</td><td><span class="pill">${esc(o.status)}</span>${o.status !== 'paid' ? `<form method="post" action="/admin/orders/${esc(o.id)}/paid"><button class="btn btn-small">Mark paid</button></form>` : ''}<br><small>${o.emailedAt ? 'Emailed to shop' : 'Email not sent'}</small></td></tr>`)
    .join('');
  res.send(page('Orders', `<h1>Orders (${store.orders().length})</h1><table class="admin-table"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No orders yet.</td></tr>'}</tbody></table>`));
});

router.post('/orders/:id/paid', (req, res) => {
  store.updateOrder(req.params.id, { status: 'paid' });
  res.redirect(303, '/admin/orders');
});

router.get('/subscribers', (req, res) => {
  const list = store.subscribers();
  res.send(page('Subscribers', `<h1>Newsletter subscribers (${list.length})</h1>${list.length ? `<p><textarea rows="4" style="width:100%" readonly>${esc(list.map((x) => x.email).join(', '))}</textarea></p>` : ''}<table class="admin-table"><thead><tr><th>Email</th><th>Signed up</th></tr></thead><tbody>${list.map((x) => `<tr><td>${esc(x.email)}</td><td>${esc(new Date(x.createdAt).toLocaleString())}</td></tr>`).join('') || '<tr><td colspan="2">No subscribers yet.</td></tr>'}</tbody></table>`));
});

router.get('/messages', (req, res) => {
  const rows = store
    .messages()
    .map((m) => `<tr><td>${esc(new Date(m.createdAt).toLocaleString())}</td><td>${esc(m.name)}<br><small>${esc(m.email)}</small></td><td>${esc(m.order)}</td><td style="white-space:pre-wrap">${esc(m.message)}</td></tr>`)
    .join('');
  res.send(page('Messages', `<h1>Messages (${store.messages().length})</h1><table class="admin-table"><thead><tr><th>Date</th><th>From</th><th>Order</th><th>Message</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No messages yet.</td></tr>'}</tbody></table>`));
});

module.exports = router;
