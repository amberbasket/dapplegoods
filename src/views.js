// Server-rendered HTML views (plain template literals, no template engine).
const store = require('./store');
const { JOURNAL, careFor, brandImage } = require('./content');
const { SHIPPING, PROVINCES } = require('./pricing');

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = (n) => '$' + Number(n).toFixed(2);
const PLACEHOLDER = '/img/placeholder.svg';
// Swap to the placeholder artwork if a product photo fails to load.
const fb = (p) => ` onerror="this.onerror=null;this.src='${esc(p?.fallbackImage || PLACEHOLDER)}'"`;
const imgOf = (p) => p?.image || PLACEHOLDER;
const HOUSE = 'Dapple Goods';
const brandLink = (p) => (p.brand ? `<a href="/brands/${store.slugify(p.brand)}">${esc(p.brand)}</a>` : '');
const onRequest = (p) => typeof p.price !== 'number';
const priceHtml = (p) => {
  if (onRequest(p)) return '<span class="on-request">Price on request</span>';
  const sale = p.compareAt && p.compareAt > p.price;
  return `${sale ? `<s>${money(p.compareAt)}</s>` : ''}<span class="${sale ? 'sale' : ''}">${money(p.price)}</span>`;
};

// The Dapple Goods mark: a dapple dachshund in profile.
const LOGO = `
<svg class="logo-mark" viewBox="4 10 60 40" aria-hidden="true">
  <g fill="currentColor">
    <path d="M12 31c-2.5-3-4.5-6.5-5.5-10 .2-.8 1-1 1.5-.4 1.6 2.8 3.6 5.3 6.2 7.2z"/>
    <rect x="11" y="27" width="36" height="14" rx="7"/>
    <path d="M40 30c1-5 3.5-9 7.5-10.5l4 4.5L47 33z"/>
    <path d="M45 15.5c3-2.3 7.5-2 10 .6l1.6 2.2c1.4.5 3.6 1.4 4.6 2.6.6.8.3 2-.6 2.4-2.2.8-5.4 1.3-8.2 1.1L50 27c-3.5.4-6.5-1.6-7-4.8-.5-2.5.4-5 2-6.7z"/>
    <rect x="14.5" y="37" width="4.6" height="10" rx="2.3"/>
    <rect x="20.5" y="37" width="4.6" height="9" rx="2.3"/>
    <rect x="35" y="37" width="4.6" height="9" rx="2.3"/>
    <rect x="41" y="37" width="4.6" height="10" rx="2.3"/>
  </g>
  <path d="M47.5 17c-2.6 1.4-3.6 4.6-3 8 .3 1.8 1.2 3.2 2.4 3.8 1.2-1.8 1.8-4.6 1.6-7.5-.1-1.6-.4-3.2-1-4.3z" fill="var(--logo-ear, #b8642f)"/>
  <g fill="var(--logo-spot, #cfc6b8)">
    <circle cx="19" cy="31" r="2.6"/><circle cx="27" cy="35.5" r="1.8"/><circle cx="31.5" cy="30" r="2.2"/>
    <circle cx="38.5" cy="34" r="1.6"/><circle cx="24" cy="29" r="1.1"/><circle cx="43" cy="28.5" r="1.3"/><circle cx="14.8" cy="35" r="1.2"/>
  </g>
  <circle cx="52.6" cy="19.2" r="1.1" fill="var(--logo-eye, #f8f3ec)"/>
  <circle cx="60.6" cy="21.5" r="1.2" fill="#1c130e"/>
</svg>`;

const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="18" r="2" fill="currentColor"/><circle cx="17" cy="18" r="2" fill="currentColor"/></svg>',
  paw: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><ellipse cx="6" cy="10" rx="2" ry="2.6"/><ellipse cx="10" cy="6.5" rx="2" ry="2.7"/><ellipse cx="14.5" cy="6.5" rx="2" ry="2.7"/><ellipse cx="18.5" cy="10" rx="2" ry="2.6"/><path d="M12.2 11.5c-3 0-6.2 4.3-6.2 6.6 0 1.8 1.5 2.5 3.1 2.5 1.3 0 2-.6 3.1-.6s1.8.6 3.1.6c1.6 0 3.1-.7 3.1-2.5 0-2.3-3.2-6.6-6.2-6.6z"/></g></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  return: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H5V3M5.6 7A8 8 0 1 1 4 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function nav(active) {
  const item = (href, label, key) => `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`;
  return `
  <nav class="main-nav" id="main-nav" aria-label="Main">
    <div class="nav-inner">
      ${item('/shop', 'Shop All', 'shop')}
      ${item('/collections/new', 'New', 'new')}
      ${liveCats().map((c) => item(`/category/${c.slug}`, esc(c.short || c.name), c.slug)).join('')}
      ${item('/collections/long-dog', 'Long Dogs', 'long-dog')}
      ${item('/brands', 'Brands', 'brands')}
    </div>
  </nav>`;
}

function brand(extra = '') {
  return `<a href="/" class="brand ${extra}" aria-label="Dapple Goods home"><span class="logo-badge">${LOGO}</span><span class="brand-name">dapple<b>goods</b></span></a>`;
}

function layout({ title, body, active, description, image }) {
  return `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title ? `${title} | Dapple Goods` : 'Dapple Goods | Toys, Treats & Gear for Dogs')}</title>
<meta name="description" content="${esc(description || 'Dapple Goods is a Canadian shop for dog toys, treats, chews, harnesses, beds and apparel, with gear chosen for dachshunds and other long, low dogs.')}">
<meta property="og:title" content="${esc(title || 'Dapple Goods')}">
<meta property="og:image" content="${esc(image || brandImage('hero'))}">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div class="announce" aria-label="Announcements">
  <div class="marquee">${Array(2).fill(`<span>Free shipping over ${money(SHIPPING.freeOver)} across Canada</span><span>${ICON.paw}</span><span>Long-dog approved gear</span><span>${ICON.paw}</span><span>Toys, treats &amp; chews (never dog food)</span><span>${ICON.paw}</span><span>30-day returns</span><span>${ICON.paw}</span>`).join('')}</div>
</div>
<header class="site-header">
  <div class="container header-inner">
    <button class="icon-btn nav-toggle" aria-label="Menu" aria-controls="main-nav" aria-expanded="false">${ICON.menu}</button>
    ${brand()}
    ${nav(active)}
    <div class="header-actions">
      <form class="search" action="/search" role="search">
        <input name="q" placeholder="Search" aria-label="Search">
        <button aria-label="Search">${ICON.search}</button>
      </form>
      <button class="icon-btn cart-btn" data-open-cart aria-label="Open bag">${ICON.bag}<span class="cart-count" data-cart-count>0</span></button>
    </div>
  </div>
</header>
<main>
${body}
</main>
${footer()}
<div class="drawer-backdrop" data-close-cart></div>
<aside class="cart-drawer" aria-label="Shopping bag" aria-hidden="true">
  <div class="drawer-head"><h2>Your Bag</h2><button class="icon-btn" data-close-cart aria-label="Close bag">✕</button></div>
  <div class="drawer-ship" data-ship-meter></div>
  <div class="drawer-items" data-cart-items></div>
  <div class="drawer-foot">
    <div class="row"><span>Subtotal</span><strong data-cart-subtotal>$0.00</strong></div>
    <p class="muted small">Shipping calculated at checkout.</p>
    <a href="/checkout" class="btn btn-primary btn-block">Checkout</a>
    <a href="/cart" class="btn btn-ghost btn-block">View bag</a>
  </div>
</aside>
<div class="toast" role="status" aria-live="polite"></div>
<script>window.SHIPPING=${JSON.stringify(SHIPPING)};</script>
<script src="/js/app.js"></script>
</body>
</html>`;
}

function footer() {
  return `
<section class="trust">
  <div class="container trust-grid">
    <div>${ICON.truck}<div><h4>Free shipping</h4><p>Across Canada over ${money(SHIPPING.freeOver)}</p></div></div>
    <div>${ICON.paw}<div><h4>Long-dog approved</h4><p>Gear picked for low riders</p></div></div>
    <div>${ICON.return}<div><h4>30-day returns</h4><p>On unused, unopened goods</p></div></div>
    <div>${ICON.gift}<div><h4>Gift notes</h4><p>Add one at checkout</p></div></div>
  </div>
</section>
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      ${brand('brand-light')}
      <p>Toys, treats, chews and everyday gear for dogs, with a soft spot for dachshunds. No dog food, just the good stuff around it.</p>
    </div>
    <div><h4>Shop</h4>${liveCats().map((c) => `<a href="/category/${c.slug}">${esc(c.name)}</a>`).join('')}<a href="/shop">Shop All</a></div>
    <div><h4>Discover</h4>${store.COLLECTIONS.map((c) => `<a href="/collections/${c.slug}">${esc(c.name)}</a>`).join('')}<a href="/brands">Shop by Brand</a></div>
    <div><h4>Help</h4><a href="/about">Our Story</a><a href="/journal">Journal</a><a href="/faq">FAQ</a><a href="/shipping-returns">Shipping &amp; Returns</a><a href="/contact">Contact</a></div>
    <div class="footer-news">
      <h4>Join the pack</h4>
      <p>New toys, treat drops and long-dog tips, a couple of times a month.</p>
      <form class="news-form" data-newsletter><input type="email" required placeholder="Your email" aria-label="Email"><button class="btn btn-primary">Join</button></form>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>© ${new Date().getFullYear()} Dapple Goods. Brand names belong to their owners.</span>
    <span>Ships across Canada · All prices in CAD</span>
  </div>
</footer>`;
}

function badgeFor(p) {
  const sale = !onRequest(p) && p.compareAt && p.compareAt > p.price;
  if (p.stock < 1) return '<span class="badge badge-dark">Sold out</span>';
  if (sale) return '<span class="badge badge-sale">Sale</span>';
  if (p.tags?.includes('new')) return '<span class="badge">New</span>';
  if (p.tags?.includes('best')) return '<span class="badge badge-best">Best seller</span>';
  return '';
}

function productCard(p) {
  return `
  <article class="card">
    <a href="/product/${esc(p.slug)}" class="card-img">
      <img src="${esc(imgOf(p))}"${fb(p)} alt="${esc(p.name)}" loading="lazy">
      ${badgeFor(p)}
      ${p.brand === HOUSE ? `<span class="house-dot" title="Dapple Goods original">${LOGO}</span>` : ''}
    </a>
    <div class="card-body">
      <p class="card-maker">${brandLink(p)}</p>
      <a href="/product/${esc(p.slug)}" class="card-title">${esc(p.name)}</a>
      <div class="card-foot">
        <div class="price">${priceHtml(p)}</div>
        ${onRequest(p) ? `<a class="add-btn" href="/contact?piece=${esc(p.slug)}">Ask</a>` : `<button class="add-btn" data-add="${esc(p.id)}" data-name="${esc(p.name)}" data-price="${p.price}" data-image="${esc(imgOf(p))}" data-slug="${esc(p.slug)}" data-brand="${esc(p.brand || '')}" ${p.stock > 0 ? '' : 'disabled'} aria-label="Add ${esc(p.name)} to bag">${p.stock > 0 ? 'Add' : 'Sold'}</button>`}
      </div>
    </div>
  </article>`;
}

function productRow({ title, kicker, href, items, tone = '' }) {
  if (!items.length) return '';
  return `
  <section class="section ${tone}">
    <div class="container">
      <div class="section-head">
        <div>${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}<h2>${esc(title)}</h2></div>
        ${href ? `<a href="${href}" class="link-arrow">View all ${ICON.arrow}</a>` : ''}
      </div>
      <div class="scroller">${items.map(productCard).join('')}</div>
    </div>
  </section>`;
}

const byTag = (tag) => store.products().filter((p) => p.tags?.includes(tag));
const inCat = (slug) => store.products().filter((p) => p.category === slug);
// Categories with at least one live product, so the menu never links to an empty page.
function liveCats() {
  return store.CATEGORIES.filter((c) => inCat(c.slug).length);
}

function brandChip(b) {
  return `<a class="brand-chip ${b.name === HOUSE ? 'house' : ''}" href="/brands/${b.slug}"><strong>${esc(b.name)}</strong><small>${b.count} item${b.count === 1 ? '' : 's'}</small></a>`;
}

function home() {
  const all = store.products();
  const newest = [...all].sort((a, b) => (b.tags.includes('new') - a.tags.includes('new')) || b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  const cats = store.CATEGORIES.map((c) => ({ ...c, p: inCat(c.slug).find((p) => p.tags.includes('best')) || inCat(c.slug)[0] })).filter((c) => c.p);
  const house = byTag('house');
  const brands = store.brands();
  return layout({
    body: `
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="kicker">Toys · Treats · Gear</p>
        <h1>Goods for every <span class="spot-word">spot.</span></h1>
        <p class="lead">Squeaky toys, good-for-them treats and comfy everyday gear for your dog, with a soft spot for long, low dachshunds.</p>
        <div class="hero-ctas"><a href="/shop" class="btn btn-primary">Shop all ${ICON.arrow}</a><a href="/collections/long-dog" class="btn btn-outline">Made for long dogs</a></div>
        <ul class="hero-points"><li>${ICON.truck} Free shipping over ${money(SHIPPING.freeOver)}</li><li>${ICON.return} 30-day returns</li></ul>
      </div>
      <div class="hero-art">
        <img src="${esc(brandImage('hero'))}" alt="A dapple dachshund on a sherpa blanket with a rope toy">
        <span class="sticker s1">${ICON.paw} Long-dog<br>approved</span>
        <span class="sticker s2">200+ goods<br>for good dogs</span>
      </div>
    </div>
  </section>

  <section class="section cats">
    <div class="container">
      <div class="cat-row">
        ${cats.map((c) => `<a href="/category/${c.slug}" class="cat"><span class="cat-img"><img src="${esc(imgOf(c.p))}"${fb(c.p)} alt="" loading="lazy"></span><span>${esc(c.name)} ${ICON.arrow}</span></a>`).join('')}
      </div>
    </div>
  </section>

  ${productRow({ title: 'Best Sellers', kicker: 'Tail-wag tested', href: '/collections/best', items: byTag('best').slice(0, 10) })}

  <section class="promise">
    <div class="container promise-grid">
      <div class="promise-copy">
        <p class="kicker light">Made for long dogs</p>
        <h2>Built long and low? We’ve got you.</h2>
        <p>Dachshunds have long backs, short legs and a strong urge to burrow. We pick gear with that in mind: harnesses instead of neck pressure, stairs instead of jumping, and sweaters that actually reach the tail.</p>
        <a href="/collections/long-dog" class="btn btn-light">Shop Long-Dog Gear</a>
      </div>
      <div class="promise-media"><img src="${esc(brandImage('burrow'))}"${fb(null)} alt="A dapple dachshund peeking out of a cave bed" loading="lazy"></div>
      <ol class="promise-list">
        <li><strong>Back-friendly</strong><span>Pet stairs and soft vest harnesses take strain off the spine.</span></li>
        <li><strong>Burrow-ready</strong><span>Cave beds and sherpa blankets for dogs who tunnel.</span></li>
        <li><strong>Cut to fit</strong><span>Sweaters and pajamas sized for long bodies and deep chests.</span></li>
      </ol>
    </div>
  </section>

  ${house.length >= 3 ? `
  <section class="section feature">
    <div class="container feature-grid">
      <a href="/collections/house" class="feature-tile">
        <img src="${esc(brandImage('walk'))}"${fb(null)} alt="A dapple dachshund walking through autumn leaves in a harness" loading="lazy">
        <div><p class="kicker light">Our own line</p><h3>Dapple Goods Originals</h3><p>Collars, beds, toys and sweaters we designed ourselves, in our chocolate, tan and silver dapple colours.</p><span class="btn btn-light">Shop Originals</span></div>
      </a>
      <div class="grid grid-2">${house.filter((p) => p.tags.includes('best')).concat(house).filter((p, i, a) => a.indexOf(p) === i).slice(0, 4).map(productCard).join('')}</div>
    </div>
  </section>` : ''}

  ${productRow({ title: 'New Arrivals', kicker: 'Just landed', href: '/collections/new', items: newest })}

  <section class="split-band">
    <div class="container split">
      <div class="split-img"><img src="${esc(brandImage('treat'))}"${fb(null)} alt="A dapple dachshund sitting politely for a treat" loading="lazy"></div>
      <div class="split-copy">
        <p class="kicker">Treats &amp; Chews</p>
        <h2>Good dogs get good treats</h2>
        <p>Training bites under 3 calories, dental chews, single-ingredient bully sticks and Canadian-made sweet potato chews. We stock treats and chews only, never dog food, so the whole shelf is the fun stuff.</p>
        <a href="/category/treats" class="btn btn-primary">Shop Treats</a>
      </div>
    </div>
  </section>

  ${productRow({ title: 'Toy Box', kicker: 'Squeak, fetch, tug', href: '/category/toys', items: inCat('toys').slice(0, 10) })}

  ${brands.length ? `
  <section class="section brands-band">
    <div class="container">
      <div class="section-head"><div><p class="kicker">The brands you know</p><h2>Shop by Brand</h2></div><a href="/brands" class="link-arrow">All brands ${ICON.arrow}</a></div>
      <div class="brand-chips">${[...brands].sort((a, b) => (b.name === HOUSE) - (a.name === HOUSE) || b.count - a.count || a.name.localeCompare(b.name)).slice(0, 14).map(brandChip).join('')}<a class="brand-chip more" href="/brands"><strong>+ ${Math.max(0, brands.length - 14)} more</strong></a></div>
    </div>
  </section>` : ''}

  ${productRow({ title: 'Howliday Gifts', kicker: 'For the season', href: '/collections/holiday', items: byTag('holiday').slice(0, 10), tone: 'tone-warm' })}

  <section class="split-band alt">
    <div class="container split">
      <div class="split-copy">
        <p class="kicker">Our story</p>
        <h2>Named for the spots</h2>
        <p>“Dapple” is the spotted coat pattern some dachshunds are born with: patches of silver and tan scattered over chocolate or black, so no two dogs look alike. We liked the idea of a shop that’s the same: a little bit of everything a dog needs, picked with care.</p>
        <a href="/about" class="btn btn-outline">Read Our Story</a>
      </div>
      <div class="split-img"><img src="${esc(brandImage('puppy'))}"${fb(null)} alt="A dapple dachshund puppy playing with toys" loading="lazy"></div>
    </div>
  </section>

  <section class="section journal">
    <div class="container">
      <div class="section-head"><div><p class="kicker">Read</p><h2>From the Journal</h2></div><a href="/journal" class="link-arrow">All stories ${ICON.arrow}</a></div>
      <div class="journal-grid">${JOURNAL.map((a) => journalCard(a)).join('')}</div>
    </div>
  </section>

  <section class="newsletter">
    <div class="container news-inner">
      <div><p class="kicker light">Join the pack</p><h2>First dibs on new toys</h2><p>Be first to hear about new toys, treat drops and long-dog tips. A couple of emails a month, never more.</p></div>
      <form class="news-form big" data-newsletter><input type="email" required placeholder="Enter your email" aria-label="Email"><button class="btn btn-primary">Join</button></form>
    </div>
  </section>`,
  });
}

const journalCard = (a, withMeta) =>
  `<a class="journal-card" href="/journal/${a.slug}"><img src="${esc(brandImage(a.image))}"${fb(null)} alt="" loading="lazy"><div>${withMeta ? `<p class="muted small">${esc(a.date)}</p>` : ''}<h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><span class="link-arrow">Read ${ICON.arrow}</span></div></a>`;

const SORTS = {
  featured: ['Featured', (a, b) => (b.tags.includes('best') - a.tags.includes('best')) || Number(a.id) - Number(b.id)],
  new: ['Newest', (a, b) => (b.tags.includes('new') - a.tags.includes('new')) || b.createdAt.localeCompare(a.createdAt)],
  'price-asc': ['Price: Low to High', (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)],
  'price-desc': ['Price: High to Low', (a, b) => (b.price ?? -1) - (a.price ?? -1)],
};

function listing({ title, kicker, blurb, items, active, query, basePath, showCatFilter = true, intro = '' }) {
  const sort = SORTS[query.sort] ? query.sort : 'featured';
  const maxPrice = Number(query.max) || 0;
  const cat = query.cat || '';
  const brandQ = query.brand || '';
  let list = items.slice();
  if (cat) list = list.filter((p) => p.category === cat);
  if (brandQ) list = list.filter((p) => p.brand && store.slugify(p.brand) === brandQ);
  if (maxPrice) list = list.filter((p) => typeof p.price === 'number' && p.price <= maxPrice);
  if (query.instock) list = list.filter((p) => p.stock > 0);
  if (query.sale) list = list.filter((p) => p.compareAt && p.compareAt > p.price);
  list.sort(SORTS[sort][1]);
  const PER_PAGE = 48;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, parseInt(query.page, 10) || 1));
  const shown = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const qs = (patch) => {
    const q = { ...query, page: '', ...patch };
    const s = Object.entries(q).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return `${basePath}${s ? '?' + s : ''}`;
  };
  const prices = [[0, 'Any price'], [15, 'Under $15'], [25, 'Under $25'], [50, 'Under $50'], [100, 'Under $100']];
  const brands = [...new Map(items.filter((p) => p.brand).map((p) => [store.slugify(p.brand), p.brand])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  return layout({
    title,
    active,
    body: `
  <section class="page-hero">
    <div class="container">
      <nav class="crumbs"><a href="/">Home</a> / <span>${esc(title)}</span></nav>
      ${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}
      <h1>${esc(title)}</h1>
      ${blurb ? `<p class="lead">${esc(blurb)}</p>` : ''}
      ${intro}
    </div>
  </section>
  <section class="section">
    <div class="container shop-layout">
      <aside class="filters">
        <h3>Filter</h3>
        ${showCatFilter ? `<div class="filter-group"><h4>Category</h4>
          <a href="${qs({ cat: '' })}" class="${!cat ? 'on' : ''}">All</a>
          ${store.CATEGORIES.map((c) => [c, items.filter((p) => p.category === c.slug).length]).filter(([, n]) => n).map(([c, n]) => `<a href="${qs({ cat: c.slug })}" class="${cat === c.slug ? 'on' : ''}">${esc(c.name)} <small>${n}</small></a>`).join('')}
        </div>` : ''}
        <div class="filter-group"><h4>Price</h4>${prices.map(([v, l]) => `<a href="${qs({ max: v || '' })}" class="${maxPrice === v ? 'on' : ''}">${l}</a>`).join('')}</div>
        <div class="filter-group"><h4>Show</h4><a href="${qs({ instock: query.instock ? '' : '1' })}" class="${query.instock ? 'on' : ''}">In stock only</a><a href="${qs({ sale: query.sale ? '' : '1' })}" class="${query.sale ? 'on' : ''}">On sale</a></div>
        ${brands.length > 1 ? `<div class="filter-group brand-filter"><h4>Brand</h4><a href="${qs({ brand: '' })}" class="${!brandQ ? 'on' : ''}">All brands</a>${brands.map(([s, n]) => `<a href="${qs({ brand: s })}" class="${brandQ === s ? 'on' : ''}">${esc(n)}</a>`).join('')}</div>` : ''}
      </aside>
      <div>
        <div class="toolbar">
          <span>${list.length} item${list.length === 1 ? '' : 's'}</span>
          <form method="get" action="${basePath}">
            ${Object.entries(query).filter(([k, v]) => k !== 'sort' && k !== 'page' && v).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')}
            <label>Sort <select name="sort" onchange="this.form.submit()">${Object.entries(SORTS).map(([k, [l]]) => `<option value="${k}" ${k === sort ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          </form>
        </div>
        ${list.length ? `<div class="grid grid-products">${shown.map(productCard).join('')}</div>` : '<p class="empty">Nothing matches those filters yet. Try clearing one.</p>'}
        ${pages > 1 ? `<nav class="pager" aria-label="Pages">${page > 1 ? `<a href="${qs({ page: page - 1 > 1 ? page - 1 : '' })}" rel="prev">← Previous</a>` : ''}${Array.from({ length: pages }, (_, i) => i + 1).map((n) => n === page ? `<span class="on" aria-current="page">${n}</span>` : `<a href="${qs({ page: n > 1 ? n : '' })}">${n}</a>`).join('')}${page < pages ? `<a href="${qs({ page: page + 1 })}" rel="next">Next →</a>` : ''}</nav>` : ''}
      </div>
    </div>
  </section>`,
  });
}

function brandsPage() {
  const brands = store.brands();
  return layout({
    title: 'Shop by Brand',
    active: 'brands',
    description: 'The dog toy, treat and gear brands stocked at Dapple Goods, plus our own Dapple Goods Originals.',
    body: `
  <section class="page-hero"><div class="container"><nav class="crumbs"><a href="/">Home</a> / <span>Brands</span></nav><p class="kicker">The brands you know</p><h1>Shop by Brand</h1><p class="lead">Trusted names in dog toys, treats and gear, plus Dapple Goods Originals, our own line.</p></div></section>
  <section class="section"><div class="container">
    <div class="brand-chips big">${brands.map(brandChip).join('')}</div>
  </div></section>`,
  });
}

function product(p) {
  const cat = store.CATEGORIES.find((c) => c.slug === p.category);
  const fromBrand = p.brand ? store.products().filter((x) => x.brand === p.brand && x.id !== p.id).slice(0, 8) : [];
  const related = store.products().filter((x) => x.category === p.category && x.id !== p.id && !fromBrand.includes(x)).slice(0, 8);
  const gallery = [imgOf(p), ...(p.images || []).filter((u) => u && u !== p.image)];
  const house = p.brand === HOUSE;
  const longDog = p.tags?.includes('long-dog');
  return layout({
    title: p.name,
    active: p.category,
    description: `${p.name}${p.brand ? ` by ${p.brand}` : ''}. ${p.description}`.slice(0, 300),
    image: p.image,
    body: `
  <section class="section">
    <div class="container">
      <nav class="crumbs"><a href="/">Home</a> / <a href="/category/${cat?.slug}">${esc(cat?.name)}</a> / <span>${esc(p.name)}</span></nav>
      <div class="pdp">
        <div class="pdp-gallery">
          <div class="pdp-main"><img src="${esc(gallery[0])}"${fb(p)} alt="${esc(p.name)}" data-main-img>${badgeFor(p)}</div>
          ${gallery.length > 1 ? `<div class="thumbs">${gallery.map((u, i) => `<button type="button" class="${i ? '' : 'on'}" data-thumb="${esc(u)}"><img src="${esc(u)}"${fb(p)} alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="pdp-info">
          <p class="pdp-maker">${brandLink(p)}</p>
          <h1>${esc(p.name)}</h1>
          <div class="price big">${priceHtml(p)}</div>
          ${longDog ? `<p class="long-dog-flag">${ICON.paw} Long-dog approved</p>` : ''}
          <p class="pdp-desc">${esc(p.description)}</p>
          ${(p.details || []).length ? `<ul class="details">${p.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          <p class="stock ${p.stock < 4 ? 'low' : ''}">${p.stock > 0 ? (p.stock < 4 ? `Only ${p.stock} left` : 'In stock, ready to ship') : 'Sold out'}</p>
          ${onRequest(p) ? `<div class="buy-row"><a class="btn btn-primary grow" href="/contact?piece=${esc(p.slug)}">Ask about this item</a></div>` : `<div class="buy-row">
            ${p.stock > 1 ? `<div class="qty"><button type="button" data-qty="-1" aria-label="Decrease">−</button><input type="number" min="1" max="${p.stock}" value="1" data-qty-input aria-label="Quantity"><button type="button" data-qty="1" aria-label="Increase">+</button></div>` : ''}
            <button class="btn btn-primary grow" data-add="${esc(p.id)}" data-name="${esc(p.name)}" data-price="${p.price}" data-image="${esc(imgOf(p))}" data-slug="${esc(p.slug)}" data-brand="${esc(p.brand || '')}" data-use-qty ${p.stock > 0 ? '' : 'disabled'}>${p.stock > 0 ? 'Add to Bag' : 'Sold Out'}</button>
          </div>`}
          <p class="ship-note">${ICON.truck} Free shipping on orders over ${money(SHIPPING.freeOver)}</p>
          <div class="maker-box">
            ${LOGO}
            <div>${house ? '<strong>A Dapple Goods Original</strong><span>Designed by us, in our dapple colours.</span>' : `<strong>${esc(p.brand || 'Dapple Goods')}</strong><span>Genuine ${esc(p.brand || '')} product, picked for our shelves.</span>`}
            ${p.brand ? `<a href="/brands/${store.slugify(p.brand)}" class="link-arrow">More from ${esc(p.brand)} ${ICON.arrow}</a>` : ''}</div>
          </div>
          <details open><summary>Safety &amp; care</summary><p>${esc(careFor(p))}</p></details>
          <details><summary>Shipping &amp; returns</summary><p>Ships within 1–3 business days. Orders over ${money(SHIPPING.freeOver)} ship free anywhere in Canada; otherwise shipping is a flat ${money(SHIPPING.flat)}. Unused items in their original packaging can be returned within 30 days. For hygiene reasons, opened treats and chews can’t be returned. <a href="/shipping-returns">Full details</a></p></details>
        </div>
      </div>
    </div>
  </section>
  ${productRow({ title: `More from ${p.brand || 'this brand'}`, kicker: house ? 'Dapple Goods Originals' : 'Same brand', href: p.brand ? `/brands/${store.slugify(p.brand)}` : null, items: fromBrand })}
  ${productRow({ title: 'You may also like', kicker: cat?.name, href: `/category/${p.category}`, items: related })}`,
  });
}

function cartPage() {
  return layout({
    title: 'Your Bag',
    body: `
  <section class="page-hero slim"><div class="container"><h1>Your Bag</h1></div></section>
  <section class="section"><div class="container cart-page">
    <div data-cart-page></div>
    <aside class="summary">
      <h3>Order Summary</h3>
      <div class="row"><span>Subtotal</span><span data-cart-subtotal>$0.00</span></div>
      <div class="row"><span>Shipping</span><span data-cart-shipping>—</span></div>
      <div class="row total"><span>Total</span><strong data-cart-total>$0.00</strong></div>
      <a href="/checkout" class="btn btn-primary btn-block">Checkout</a>
      <a href="/shop" class="btn btn-ghost btn-block">Keep shopping</a>
    </aside>
  </div></section>`,
  });
}

function checkoutPage({ mode }) {
  const field = (name, label, attrs = '') => `<label class="field"><span>${label}</span><input name="${name}" ${attrs}></label>`;
  return layout({
    title: 'Checkout',
    body: `
  <section class="page-hero slim"><div class="container"><h1>Checkout</h1></div></section>
  <section class="section"><div class="container checkout">
    <form class="checkout-form" data-checkout>
      <h3>Contact</h3>
      ${field('email', 'Email', 'type="email" required autocomplete="email"')}
      ${field('phone', 'Phone (optional)', 'type="tel" autocomplete="tel"')}
      <h3>Shipping address</h3>
      <div class="two">${field('firstName', 'First name', 'required autocomplete="given-name"')}${field('lastName', 'Last name', 'required autocomplete="family-name"')}</div>
      ${field('address', 'Address', 'required autocomplete="address-line1"')}
      ${field('address2', 'Apartment, suite, etc. (optional)', 'autocomplete="address-line2"')}
      <div class="three">${field('city', 'City', 'required autocomplete="address-level2"')}<label class="field"><span>Province</span><select name="region" required autocomplete="address-level1"><option value="">Choose…</option>${PROVINCES.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></label>${field('postal', 'Postal code', 'required autocomplete="postal-code" placeholder="M5V 2T6" pattern="[A-Za-z][0-9][A-Za-z] ?[0-9][A-Za-z][0-9]" title="Canadian postal code, like M5V 2T6"')}</div>
      <label class="field"><span>Country</span><input value="Canada" disabled></label>
      <label class="field"><span>Order note or gift message (optional)</span><textarea name="giftNote" rows="2" maxlength="300" placeholder="Engraving for an ID tag, or a note we’ll write on a card"></textarea></label>
      <p class="form-error" data-error></p>
      <button class="btn btn-primary btn-block big" data-submit>${mode === 'invoice' ? 'Place Order' : 'Continue to Payment'}</button>
    </form>
    <aside class="summary">
      <h3>Your Bag</h3>
      <div data-checkout-items></div>
      <div class="row"><span>Subtotal</span><span data-cart-subtotal>$0.00</span></div>
      <div class="row"><span>Shipping</span><span data-cart-shipping>—</span></div>
      <div class="row total"><span>Total</span><strong data-cart-total>$0.00</strong></div>
      <p class="muted small">Prices in CAD. Applicable taxes are added to your invoice.</p>
    </aside>
  </div></section>`,
  });
}

function orderPage(o) {
  return layout({
    title: 'Thank you',
    body: `
  <section class="section"><div class="container narrow center-block">
    <p class="kicker">Thank you, ${esc(o.customer.firstName)}</p>
    <h1>We’ve got your order</h1>
    <p>Order <strong>${esc(o.id)}</strong> · ${o.status === 'paid' ? 'Paid' : 'Awaiting payment'}</p>
    <p class="muted">${o.mode === 'invoice' ? `We’ll email an invoice to ${esc(o.customer.email)} within one business day, and your order ships as soon as it’s paid. ` : ''}Keep your order number for your records. Questions? <a href="/contact">Contact us</a>.</p>
    <div class="summary left">
      ${o.items.map((i) => `<div class="line"><img src="${esc(i.image || PLACEHOLDER)}"${fb(i)} alt=""><span>${esc(i.name)}${i.brand ? `<br><small class="muted">${esc(i.brand)}</small>` : ''} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join('')}
      <div class="row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
      <div class="row"><span>Shipping</span><span>${o.shipping ? money(o.shipping) : 'Free'}</span></div>
      <div class="row total"><span>Total</span><strong>${money(o.total)}</strong></div>
      <p class="muted small">Prices in CAD. Applicable taxes are added to your invoice.</p>
    </div>
    <a href="/shop" class="btn btn-primary">Keep Shopping</a>
  </div></section>
  <script>try{localStorage.removeItem('dg_cart')}catch(e){}</script>`,
  });
}

function aboutPage() {
  return layout({
    title: 'Our Story',
    active: 'about',
    description: 'Dapple Goods is a Canadian shop for dog toys, treats and gear, named after the spotted dapple dachshund.',
    body: `
  <section class="page-hero"><div class="container"><nav class="crumbs"><a href="/">Home</a> / <span>Our Story</span></nav><p class="kicker">Our story</p><h1>Named for the spots</h1><p class="lead">A Canadian shop for dog toys, treats and everyday gear, inspired by the dapple dachshund.</p></div></section>
  <section class="section"><div class="container split">
    <div class="split-img"><img src="${esc(brandImage('hero'))}"${fb(null)} alt="A dapple dachshund on a sherpa blanket with a rope toy"></div>
    <div class="split-copy">
      <p class="kicker">Why “Dapple”</p>
      <h2>No two alike</h2>
      <p>Dapple is a coat pattern found in dachshunds: patches of silver, tan and cream scattered across a chocolate or black coat, so every dapple dog has its own map of spots. That’s the feeling we wanted for the shop: a bit of everything a dog needs, each piece picked on purpose.</p>
      <p>You’ll find the toys, treats and gear you already trust from the big pet stores, from KONG and Chuckit! to Greenies and Ruffwear, side by side with Dapple Goods Originals, our own collars, beds, sweaters and toys in our dapple colours.</p>
    </div>
  </div></section>
  <section class="promise"><div class="container promise-grid two-col">
    <div class="promise-copy">
      <p class="kicker light">How we pick</p>
      <h2>What makes the shelf</h2>
      <p>We don’t carry dog food. Everything else a dog loves is fair game, as long as it passes a few simple tests.</p>
    </div>
    <ol class="promise-list">
      <li><strong>Long-dog friendly</strong><span>We think about backs, short legs and burrowing in everything we choose.</span></li>
      <li><strong>Safe and sturdy</strong><span>Toys and chews from brands with a track record, with honest safety notes on every page.</span></li>
      <li><strong>Little extras</strong><span>Free shipping over ${money(SHIPPING.freeOver)}, gift notes, and real people answering your emails.</span></li>
    </ol>
  </div></section>
  <section class="section center-block"><div class="container narrow"><h2>Ready to spoil someone?</h2><p>Start with the toys and treats dogs come back for.</p><a href="/collections/best" class="btn btn-primary">Shop Best Sellers</a></div></section>`,
  });
}

function faqPage({ mode } = {}) {
  const qa = [
    ['Do you sell dog food?', 'No. We stock toys, treats, chews and gear, but not dog food. Your dog’s main diet is best chosen with your vet and bought fresh from a local store.'],
    ['Are the branded products genuine?', 'Yes. Branded items like KONG, Chuckit! and Greenies are the real thing, sourced through Canadian distributors. Dapple Goods Originals are our own designs.'],
    ['How do I pay?', mode === 'invoice' ? 'No card is needed at checkout. After you place your order we email you an invoice within one business day, and your order ships as soon as it’s paid.' : 'You pay at checkout on Stripe’s secure payment page. We never see or store your card number.'],
    ['How long does shipping take?', `Orders ship within 1–3 business days once paid. Shipping is free on orders over ${money(SHIPPING.freeOver)} and a flat ${money(SHIPPING.flat)} otherwise. We currently ship within Canada.`],
    ['What size harness or sweater should my dachshund get?', 'Measure around the widest part of the chest and along the back from the base of the neck to the base of the tail, then compare with the sizes listed on the product page. If you’re between sizes, send us the measurements and we’ll help.'],
    ['How do I order an engraved ID tag?', 'Add the Brass Bone ID Tag to your bag and type the name and phone number you want in the order note at checkout. We’ll confirm the spelling by email before engraving.'],
    ['What is your return policy?', 'Unused items in their original packaging can be returned within 30 days of delivery. For hygiene reasons, opened treats, chews and used grooming products can’t be returned. Engraved tags are final sale.'],
    ['Can you include a gift note?', 'Yes. Add it in the order note at checkout and we’ll write it on a card and tuck it in.'],
  ];
  return layout({
    title: 'FAQ',
    active: 'faq',
    body: `
  <section class="page-hero"><div class="container"><p class="kicker">Good questions</p><h1>Frequently Asked Questions</h1></div></section>
  <section class="section"><div class="container narrow faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
    <p class="center"><a href="/contact" class="link-arrow">Still wondering? Contact us ${ICON.arrow}</a></p>
  </div></section>`,
  });
}

function shippingPage() {
  return layout({
    title: 'Shipping & Returns',
    body: `
  <section class="page-hero"><div class="container"><p class="kicker">The details</p><h1>Shipping &amp; Returns</h1></div></section>
  <section class="section"><div class="container narrow prose">
    <h2>Shipping</h2>
    <p>Every order is packed with care and ships within 1–3 business days once paid.</p>
    <ul>
      <li>Free standard shipping on orders over ${money(SHIPPING.freeOver)}</li>
      <li>Flat ${money(SHIPPING.flat)} standard shipping on orders under ${money(SHIPPING.freeOver)}</li>
      <li>We currently ship within Canada only</li>
      <li>All prices are in Canadian dollars. GST/HST and any provincial sales tax are added to your invoice where they apply.</li>
    </ul>
    <h2>Returns</h2>
    <p>If something isn’t right, you can return unused items in their original packaging within 30 days of delivery for a refund of the item price. Original shipping charges are not refundable.</p>
    <p>For hygiene and safety reasons, we can’t accept returns of opened treats and chews, used grooming products, or toys that have been played with. Engraved ID tags are final sale.</p>
    <p>To start a return, <a href="/contact">send us a note</a> with your order number and we’ll reply with instructions.</p>
    <h2>Damaged in transit?</h2>
    <p>If anything arrives damaged, contact us within 7 days with a photo and we’ll make it right.</p>
  </div></section>`,
  });
}

function contactPage({ sent, piece } = {}) {
  return layout({
    title: 'Contact Us',
    body: `
  <section class="page-hero"><div class="container"><p class="kicker">Say hello</p><h1>Contact Us</h1><p class="lead">Questions about sizing, an order or a product? We reply within one business day.</p></div></section>
  <section class="section"><div class="container narrow">
    ${sent ? '<div class="notice center">Thank you! Your message is on its way and we’ll be in touch soon.</div>' : `
    <form class="checkout-form" method="post" action="/contact">
      <div class="two"><label class="field"><span>Name</span><input name="name" required autocomplete="name"></label><label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email"></label></div>
      <label class="field"><span>Order number (optional)</span><input name="order"></label>
      ${piece ? `<div class="notice">Asking about <a href="/product/${esc(piece.slug)}">${esc(piece.name)}</a></div>` : ''}
      <label class="field"><span>Message</span><textarea name="message" rows="6" required>${piece ? esc(`Hi! I have a question about "${piece.name}" (item #${piece.id}).\n\n`) : ''}</textarea></label>
      <button class="btn btn-primary">Send Message</button>
    </form>`}
  </div></section>`,
  });
}

function journalIndex() {
  return layout({
    title: 'Journal',
    body: `
  <section class="page-hero"><div class="container"><p class="kicker">Read</p><h1>Journal</h1><p class="lead">Care guides and long-dog tips from the shop.</p></div></section>
  <section class="section"><div class="container"><div class="journal-grid">${JOURNAL.map((a) => journalCard(a, true)).join('')}</div></div></section>`,
  });
}

function journalArticle(a) {
  const body = a.body.map((para) => (para.startsWith('## ') ? `<h2>${esc(para.slice(3))}</h2>` : `<p>${esc(para)}</p>`)).join('');
  return layout({
    title: a.title,
    description: a.summary,
    image: brandImage(a.image),
    body: `
  <article class="section"><div class="container narrow prose">
    <nav class="crumbs"><a href="/">Home</a> / <a href="/journal">Journal</a> / <span>${esc(a.title)}</span></nav>
    <p class="kicker">${esc(a.date)}</p>
    <h1>${esc(a.title)}</h1>
    <img class="prose-hero" src="${esc(brandImage(a.image))}"${fb(null)} alt="">
    ${body}
    <p><a href="/journal" class="link-arrow">← Back to the journal</a></p>
  </div></article>`,
  });
}

function notFound() {
  return layout({
    title: 'Not found',
    body: `<section class="section"><div class="container narrow center-block">${LOGO}<p class="kicker">404</p><h1>This page went down a burrow</h1><p>We couldn’t find it. It may have sold out or moved.</p><a href="/shop" class="btn btn-primary">Shop all</a></div></section>`,
  });
}

module.exports = { layout, home, listing, brandsPage, product, cartPage, checkoutPage, orderPage, aboutPage, faqPage, shippingPage, contactPage, journalIndex, journalArticle, notFound, esc, money, LOGO, PLACEHOLDER };
