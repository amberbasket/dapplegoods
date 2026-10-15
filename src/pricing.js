// Shipping rules and server-side cart pricing (never trust client prices).
const SHIPPING = { freeOver: 59, flat: 9.95 };

// Canadian provinces and territories for the checkout address.
const PROVINCES = [
  ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'], ['NB', 'New Brunswick'],
  ['NL', 'Newfoundland and Labrador'], ['NS', 'Nova Scotia'], ['NT', 'Northwest Territories'], ['NU', 'Nunavut'],
  ['ON', 'Ontario'], ['PE', 'Prince Edward Island'], ['QC', 'Quebec'], ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
];

function priceCart(items, store) {
  const lines = [];
  for (const { id, qty } of Array.isArray(items) ? items : []) {
    const p = store.product(String(id));
    const q = Math.max(1, Math.min(99, parseInt(qty, 10) || 0));
    if (!p) throw new Error('An item in your bag is no longer available.');
    if (typeof p.price !== 'number') throw new Error(`"${p.name}" is priced on request. Please contact us about it.`);
    if (p.stock < q) throw new Error(`Only ${p.stock} of "${p.name}" left in stock.`);
    lines.push({ id: p.id, slug: p.slug, name: p.name, brand: p.brand || null, image: p.image, fallbackImage: p.fallbackImage, price: p.price, qty: q });
  }
  if (!lines.length) throw new Error('Your bag is empty.');
  const subtotal = round(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const shipping = subtotal >= SHIPPING.freeOver ? 0 : SHIPPING.flat;
  return { items: lines, subtotal, shipping, total: round(subtotal + shipping) };
}

const round = (n) => Math.round(n * 100) / 100;

module.exports = { SHIPPING, PROVINCES, priceCart };
