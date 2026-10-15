const express = require('express');
const path = require('path');
const store = require('./src/store');
const views = require('./src/views');
const { priceCart, PROVINCES } = require('./src/pricing');
const admin = require('./src/admin');
const { JOURNAL } = require('./src/content');
const mailer = require('./src/mailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
// Without Stripe, orders are placed unpaid and the shop emails the customer an invoice.
const MODE = STRIPE_KEY ? 'stripe' : 'invoice';

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.use('/uploads', express.static(store.UPLOADS_DIR, { maxAge: '7d' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/', (req, res) => res.send(views.home()));

app.get('/shop', (req, res) =>
  res.send(views.listing({ title: 'Shop All', kicker: 'Everything for your dog', items: store.products(), active: 'shop', query: req.query, basePath: '/shop' }))
);

app.get('/brands', (req, res) => res.send(views.brandsPage()));
app.get('/brands/:slug', (req, res, next) => {
  const b = store.brands().find((x) => x.slug === req.params.slug);
  if (!b) return next();
  const items = store.products().filter((p) => p.brand && store.slugify(p.brand) === b.slug);
  res.send(views.listing({ title: b.name, kicker: b.name === 'Dapple Goods' ? 'Our own line' : 'Brand', items, active: 'brands', query: req.query, basePath: req.path }));
});

app.get('/category/:slug', (req, res, next) => {
  const c = store.CATEGORIES.find((x) => x.slug === req.params.slug);
  if (!c) return next();
  const items = store.products().filter((p) => p.category === c.slug);
  res.send(views.listing({ title: c.name, blurb: c.blurb, items, active: c.slug, query: req.query, basePath: req.path, showCatFilter: false }));
});

app.get('/collections/:slug', (req, res, next) => {
  const c = store.COLLECTIONS.find((x) => x.slug === req.params.slug);
  if (!c) return next();
  const items = store.products().filter((p) => (c.slug === 'gift' ? typeof p.price === 'number' && p.price < 25 : p.tags?.includes(c.slug)));
  res.send(views.listing({ title: c.name, kicker: c.season, blurb: c.blurb, items, active: c.slug === 'new' ? 'new' : 'shop', query: req.query, basePath: req.path }));
});

app.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const items = q ? store.products().filter((p) => `${p.name} ${p.description} ${p.category} ${p.brand || ''} ${(p.details || []).join(' ')}`.toLowerCase().includes(q)) : [];
  res.send(views.listing({ title: q ? `Search: “${req.query.q}”` : 'Search', items, query: req.query, basePath: '/search' }));
});

app.get('/product/:slug', (req, res, next) => {
  const p = store.product(req.params.slug);
  if (!p) return next();
  res.send(views.product(p));
});

app.get('/cart', (req, res) => res.send(views.cartPage()));
app.get('/checkout', (req, res) => res.send(views.checkoutPage({ mode: MODE })));
app.get('/about', (req, res) => res.send(views.aboutPage()));
app.get('/our-story', (req, res) => res.redirect(301, '/about'));
app.get('/faq', (req, res) => res.send(views.faqPage({ mode: MODE })));
app.get('/shipping-returns', (req, res) => res.send(views.shippingPage()));
app.get('/journal', (req, res) => res.send(views.journalIndex()));
app.get('/journal/:slug', (req, res, next) => {
  const a = JOURNAL.find((x) => x.slug === req.params.slug);
  if (!a) return next();
  res.send(views.journalArticle(a));
});
app.get('/contact', (req, res) => res.send(views.contactPage({ sent: req.query.sent === '1', piece: store.product(String(req.query.piece || '')) })));
app.post('/contact', express.urlencoded({ extended: false, limit: '20kb' }), (req, res) => {
  const { name, email, order, message } = req.body || {};
  if (!name || !email || !message) return res.redirect('/contact');
  store.createMessage({ name: String(name).slice(0, 200), email: String(email).slice(0, 200), order: String(order || '').slice(0, 50), message: String(message).slice(0, 5000) });
  res.redirect(303, '/contact?sent=1');
});

app.post('/api/subscribe', express.json({ limit: '2kb' }), (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  store.addSubscriber(email);
  res.json({ ok: true });
});

// Live product info for the client-side cart (keeps prices/stock current).
app.get('/api/products', (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter(Boolean);
  res.json(ids.map((id) => store.product(id)).filter(Boolean).map(({ id, slug, name, price, image, brand, stock }) => ({ id, slug, name, price, image, brand, stock })));
});

function takeStock(order) {
  for (const i of order.items) {
    const p = store.product(i.id);
    if (p) store.saveProduct({ id: p.id, stock: Math.max(0, p.stock - i.qty) });
  }
}

// Emails the shop once per order; a failed send is logged and retried on the next call.
async function notifyShop(order) {
  const o = store.order(order.id);
  if (!o || o.emailedAt) return;
  try {
    if (await mailer.sendOrderEmail(o)) store.updateOrder(o.id, { emailedAt: new Date().toISOString() });
  } catch (e) {
    console.error(`Order email failed for ${o.id}:`, e.message);
  }
}

function markPaid(o) {
  if (o.status === 'paid') return;
  store.updateOrder(o.id, { status: 'paid' });
  takeStock(o);
}

async function stripe(method, endpoint, form) {
  const r = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || 'Payment provider error');
  return j;
}

// Stripe webhook, so paid orders are emailed even if the customer closes the tab
// before returning to the site. Set STRIPE_WEBHOOK_SECRET to enable.
app.post('/api/stripe-webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(404).end();
  const sig = Object.fromEntries(String(req.get('stripe-signature') || '').split(',').map((kv) => kv.split('=')));
  const expected = crypto.createHmac('sha256', secret).update(`${sig.t}.${req.body}`).digest('hex');
  const ok = sig.v1 && sig.v1.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig.v1), Buffer.from(expected));
  if (!ok || Math.abs(Date.now() / 1000 - Number(sig.t)) > 300) return res.status(400).end();
  const event = JSON.parse(req.body);
  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
    const o = store.order(event.data.object.client_reference_id);
    if (o) {
      markPaid(o);
      await notifyShop(o);
    }
  }
  res.json({ received: true });
});

app.post('/api/checkout', express.json({ limit: '50kb' }), async (req, res) => {
  try {
    const { items, customer = {} } = req.body || {};
    for (const k of ['email', 'firstName', 'lastName', 'address', 'city', 'region', 'postal']) {
      if (!String(customer[k] || '').trim()) throw new Error('Please fill in all shipping fields.');
    }
    const priced = priceCart(items, store);
    const cust = Object.fromEntries(['email', 'firstName', 'lastName', 'address', 'city', 'region', 'postal'].map((k) => [k, String(customer[k]).slice(0, 200)]));
    for (const k of ['address2', 'phone']) cust[k] = String(customer[k] || '').slice(0, 200);
    cust.giftNote = String(customer.giftNote || '').slice(0, 300);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cust.email)) throw new Error('Please enter a valid email address.');
    if (!PROVINCES.some(([c]) => c === cust.region)) throw new Error('Please choose a province or territory.');
    const postal = cust.postal.toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postal)) throw new Error('Please enter a valid Canadian postal code, like R3C 1A1.');
    cust.postal = `${postal.slice(0, 3)} ${postal.slice(3)}`;

    if (MODE === 'invoice') {
      const order = store.createOrder({ ...priced, customer: cust, status: 'awaiting payment', mode: 'invoice' });
      takeStock(order);
      await notifyShop(order);
      return res.json({ redirect: `/order/${order.id}` });
    }

    const order = store.createOrder({ ...priced, customer: cust, status: 'pending', mode: 'stripe' });
    const base = `${req.protocol}://${req.get('host')}`;
    const form = {
      mode: 'payment',
      customer_email: cust.email,
      success_url: `${base}/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart`,
      client_reference_id: order.id,
    };
    priced.items.forEach((l, i) => {
      form[`line_items[${i}][quantity]`] = l.qty;
      form[`line_items[${i}][price_data][currency]`] = 'cad';
      form[`line_items[${i}][price_data][unit_amount]`] = Math.round(l.price * 100);
      form[`line_items[${i}][price_data][product_data][name]`] = l.name;
    });
    if (priced.shipping) {
      const i = priced.items.length;
      form[`line_items[${i}][quantity]`] = 1;
      form[`line_items[${i}][price_data][currency]`] = 'cad';
      form[`line_items[${i}][price_data][unit_amount]`] = Math.round(priced.shipping * 100);
      form[`line_items[${i}][price_data][product_data][name]`] = 'Shipping';
    }
    const session = await stripe('POST', 'checkout/sessions', form);
    store.updateOrder(order.id, { stripeSession: session.id });
    res.json({ redirect: session.url });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/order/:id', async (req, res, next) => {
  const o = store.order(req.params.id);
  if (!o) return next();
  if (o.mode === 'stripe' && o.status === 'pending' && o.stripeSession) {
    try {
      const s = await stripe('GET', `checkout/sessions/${o.stripeSession}`);
      if (s.payment_status === 'paid') {
        markPaid(o);
        await notifyShop(o);
      }
    } catch (e) {
      console.error('Stripe verify failed', e.message);
    }
  }
  res.send(views.orderPage(store.order(o.id)));
});

app.use('/admin', admin);

app.use((req, res) => res.status(404).send(views.notFound()));

app.listen(PORT, () => console.log(`Dapple Goods running on http://localhost:${PORT} (checkout: ${MODE}, order emails to ${mailer.ORDER_EMAIL} via ${mailer.PROVIDER || 'console log only'})`));
