// Builds seed/products.json from scripts/catalog.js. Run with `npm run seed:build`.
const fs = require('fs');
const path = require('path');
const catalog = require('./catalog');

const slugify = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const start = Date.parse('2026-10-01T12:00:00Z');
const products = catalog.map(([brand, name, category, price, compareAt, stock, tags, description, details], i) => {
  const slug = slugify(name);
  return {
    id: String(i + 1),
    slug,
    name,
    brand,
    category,
    price,
    compareAt,
    stock,
    image: `/img/products/${slug}.jpg`,
    // No real photo yet: keep it as a draft (visible in /admin only) until one is added.
    ...(fs.existsSync(path.join(__dirname, '..', 'public', 'img', 'products', `${slug}.jpg`)) ? {} : { draft: true }),
    images: [],
    description,
    details,
    tags,
    createdAt: new Date(start + i * 3600e3).toISOString(),
  };
});
fs.writeFileSync(path.join(__dirname, '..', 'seed', 'products.json'), JSON.stringify(products, null, 2) + '\n');
console.log(`Wrote ${products.length} products.`);
