// Tiny JSON-file store. Products and orders live in DATA_DIR so a Railway
// volume can be mounted there to keep them across deploys.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
// A Railway volume sets RAILWAY_VOLUME_MOUNT_PATH, so data lands on it without extra config.
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(ROOT, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const SEED_FILE = path.join(ROOT, 'seed', 'products.json');
const SEED_STATE_FILE = path.join(DATA_DIR, 'seed-state.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

let products = readJson(PRODUCTS_FILE, null);
const seedText = fs.readFileSync(SEED_FILE, 'utf8');
const seedHash = crypto.createHash('sha1').update(seedText).digest('hex');
const seedState = readJson(SEED_STATE_FILE, { hash: null, deleted: [] });
if (!products) {
  products = JSON.parse(seedText);
  writeJson(PRODUCTS_FILE, products);
} else if (seedState.hash !== seedHash) {
  // The seed changed in a new deploy: refresh products nobody has edited in
  // /admin (keeping their current stock), and add new seed products.
  for (const seed of JSON.parse(seedText)) {
    if (seedState.deleted.includes(seed.id)) continue;
    const i = products.findIndex((p) => p.id === seed.id);
    if (i === -1) products.push(seed);
    else if (!products[i].editedAt) products[i] = { ...seed, stock: products[i].stock };
  }
  writeJson(PRODUCTS_FILE, products);
}
seedState.hash = seedHash;
writeJson(SEED_STATE_FILE, seedState);
let orders = readJson(ORDERS_FILE, []);
let messages = readJson(MESSAGES_FILE, []);
let subscribers = readJson(SUBSCRIBERS_FILE, []);

const CATEGORIES = [
  { slug: 'toys', name: 'Toys', blurb: 'Squeakers, chews, fetch gear and puzzles to keep busy dogs busy.' },
  { slug: 'treats', name: 'Treats & Chews', blurb: 'Training bites, biscuits, dental chews and long-lasting chews. (We don’t sell dog food.)' },
  { slug: 'walk', name: 'Walk', blurb: 'Harnesses, collars, leashes and tags for every walk.' },
  { slug: 'home', name: 'Beds & Home', blurb: 'Burrow beds, blankets, bowls and pet stairs.' },
  { slug: 'apparel', name: 'Apparel', blurb: 'Sweaters, raincoats, boots and bandanas, many cut for long dogs.' },
  { slug: 'grooming', name: 'Grooming', blurb: 'Brushes, shampoo, wipes, nail and dental care.' },
  { slug: 'travel', name: 'Travel & Outdoors', blurb: 'Carriers, car seats, life jackets and poop bags.' },
];

const COLLECTIONS = [
  { slug: 'new', name: 'New Arrivals', season: 'Just in', blurb: 'The newest goods on the shelf.' },
  { slug: 'best', name: 'Best Sellers', season: 'All year', blurb: 'What dogs (and their people) come back for.' },
  { slug: 'long-dog', name: 'Made for Long Dogs', season: 'Dachshund approved', blurb: 'Back-friendly harnesses, pet stairs, burrow beds and sweaters that actually cover a long back.' },
  { slug: 'house', name: 'Dapple Goods Originals', season: 'Our own line', blurb: 'Collars, beds, sweaters and toys we designed ourselves, in our dapple colours.' },
  { slug: 'holiday', name: 'Howliday Gifts', season: 'Holiday', blurb: 'Cozy sweaters, pajamas, blankets and treats for the season.' },
  { slug: 'gift', name: 'Gifts Under $25', season: 'All year', blurb: 'Little things for the dogs you love.' },
];

const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Brands are derived from the products, so adding a product with a new brand adds it here.
function brands() {
  const map = new Map();
  for (const p of store.products()) {
    if (!p.brand) continue;
    const slug = slugify(p.brand);
    const b = map.get(slug) || { slug, name: p.brand, count: 0, image: p.image };
    b.count++;
    map.set(slug, b);
  }
  return [...map.values()].sort((a, b) => (b.name === 'Dapple Goods') - (a.name === 'Dapple Goods') || a.name.localeCompare(b.name));
}

const store = {
  DATA_DIR,
  UPLOADS_DIR,
  CATEGORIES,
  COLLECTIONS,
  slugify,
  brands,
  // Drafts (missing photos or prices) show only in /admin until they're published.
  products: () => products.filter((p) => !p.draft),
  product: (idOrSlug) => products.find((p) => !p.draft && (p.id === idOrSlug || p.slug === idOrSlug)),
  allProducts: () => products,
  anyProduct: (id) => products.find((p) => p.id === id),
  saveProduct(input) {
    const existing = input.id && products.find((p) => p.id === input.id);
    if (existing) {
      Object.assign(existing, input);
    } else {
      const id = String(Math.max(0, ...products.map((p) => Number(p.id) || 0)) + 1);
      products.push({ createdAt: new Date().toISOString(), ...input, id });
    }
    writeJson(PRODUCTS_FILE, products);
    return existing || products[products.length - 1];
  },
  deleteProduct(id) {
    products = products.filter((p) => p.id !== id);
    writeJson(PRODUCTS_FILE, products);
    seedState.deleted.push(id);
    writeJson(SEED_STATE_FILE, seedState);
  },
  messages: () => messages,
  createMessage(m) {
    messages.unshift({ id: crypto.randomBytes(4).toString('hex'), createdAt: new Date().toISOString(), ...m });
    writeJson(MESSAGES_FILE, messages);
  },
  subscribers: () => subscribers,
  addSubscriber(email) {
    if (subscribers.some((x) => x.email === email)) return;
    subscribers.unshift({ email, createdAt: new Date().toISOString() });
    writeJson(SUBSCRIBERS_FILE, subscribers);
  },
  orders: () => orders,
  order: (id) => orders.find((o) => o.id === id),
  createOrder(order) {
    // Random order numbers like DG12042; widen to 6 digits if 5 ever run short.
    let id;
    for (let tries = 0; !id || orders.some((x) => x.id === id); tries++) id = 'DG' + crypto.randomInt(tries < 50 ? 10000 : 100000, tries < 50 ? 100000 : 1000000);
    const o = { id, createdAt: new Date().toISOString(), ...order };
    orders.unshift(o);
    writeJson(ORDERS_FILE, orders);
    return o;
  },
  updateOrder(id, patch) {
    const o = orders.find((x) => x.id === id);
    if (o) {
      Object.assign(o, patch);
      writeJson(ORDERS_FILE, orders);
    }
    return o;
  },
};

module.exports = store;
