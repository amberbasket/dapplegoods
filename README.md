# Dapple Goods

**Dapple Dog Goods**: an online shop for dog toys, treats, chews and everyday gear (no dog food), branded around the
dapple dachshund. Same setup as Amber Basket and Cedar Bundle: Node + Express, server-rendered pages, JSON-file
storage. Dependencies: `express`, plus `nodemailer` for SMTP email.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000, admin password "dapple"
```

## The brand

- **Name:** Dapple Goods (Dapple Dog Goods). "Dapple" is the spotted coat pattern found in dachshunds.
- **Tagline:** "Goods for every spot."
- **Look:** bright and playful, on purpose unlike Amber Basket and Cedar Bundle: one-row header, scrolling butter-yellow
  announcement bar, split hero with sticker badges, pastel category tiles, rounded everything.
- **Colours:** tomato `#ff5a36`, ink `#231a15`, butter `#ffd56b`, sky `#cfe8ff`, peach, mint, cream `#fffaf3`
  (see the top of `public/css/style.css`).
- **Type:** Bricolage Grotesque (extra bold) for headings and the wordmark, Figtree for text.
- **Logo:** lowercase "dapple**goods**" wordmark beside a tilted tomato badge with a spotted dachshund, drawn in SVG
  in `src/views.js` (`LOGO`) and `public/img/favicon.svg`.
- **Angle:** "Made for Long Dogs": back-friendly harnesses, pet stairs, burrow beds and sweaters cut for long bodies.

## What's included

- Home page: hero, category circles, Best Sellers, Made for Long Dogs band, Dapple Goods Originals feature,
  New Arrivals, treats feature, Toy Box, Shop by Brand, Howliday Gifts, Our Story, journal, newsletter, trust bar, footer
- 236 products from 100+ brands in 7 departments: Toys, Treats & Chews, Walk, Beds & Home, Apparel, Grooming, Travel & Outdoors.
  46 are brands PetSmart and Bosley's carry (KONG, Chuckit!, Benebone, Nylabone, Greenies, Zuke's, PetSafe, Ruffwear,
  Kurgo, FURminator, Earth Rated and more) and 14 are **Dapple Goods Originals**, our own line in dapple colours.
- Collections: New, Best Sellers, Made for Long Dogs, Dapple Goods Originals, Howliday Gifts, Gifts Under $25
- Shop all, categories, collections, brand pages (`/brands`) and search, with price, brand, in-stock and sale filters
- Product pages with brand, "Long-dog approved" flag, details, safety & care notes, stock level, related items
- Slide-out bag, cart page, free-shipping meter (free over $59, else $9.95; set in `src/pricing.js`)
- Checkout emails every order to `ORDER_EMAIL` (default `hello@dapplegoods.ca`) with order numbers like `DG12042`.
  The order note box takes gift messages and ID-tag engraving text.
  - No `STRIPE_SECRET_KEY` → customer orders without a card, you email an invoice, then click **Mark paid** in `/admin/orders`
  - `STRIPE_SECRET_KEY` set → customer pays on Stripe Checkout (set `STRIPE_WEBHOOK_SECRET` and point a webhook for
    `checkout.session.completed` at `/api/stripe-webhook`)
- `/admin` (password from `ADMIN_PASSWORD`): products (brand, price, sale price, stock, photo upload, collections,
  drafts), orders, contact messages, newsletter subscribers
- Our Story, FAQ, Shipping & Returns (no returns on opened treats), Contact and Journal (3 articles: protecting a
  dachshund's back, choosing the right chew, short coats in a Canadian winter)

## Before launch

1. **Suppliers and prices.** Prices are typical Canadian retail, set by us. Branded items need a wholesale account
   with each brand or a Canadian pet distributor; confirm costs, then adjust prices and stock in /admin.
2. **Photos.** Branded products use the manufacturers' real product photos, taken from the brands' own sites and
   PetSmart (sources in `seed/photo-sources.json`). Brands normally give stockists official image packs, so swap
   those in through /admin once you have distributor accounts. Products with no real photo yet are saved as
   drafts (shown only in /admin). The Dapple Goods Originals and homepage lifestyle images are still
   AI-generated placeholders (`seed/photo-urls.json`) until you have real photos of your own.
3. **Dapple Goods Originals.** The 17 house products (Frank the Dapple plush, dapple collar and leash, burrow bed,
   sweater, bandana and so on) need a maker. Until you have one, mark them Draft in /admin or take pre-orders.
4. **Brand names** are used only to say what the product is. Don't use brand logos without each brand's permission.
5. Set `ORDER_EMAIL`, `MAIL_FROM` and a domain, and verify the domain in Resend.

## Editing the catalog

Edit products in `/admin`, or edit `scripts/catalog.js` and run `npm run seed:build` to rewrite `seed/products.json`. The October 2026 additions live in `scripts/catalog-extra-*.js`; add new products at the end so existing ids stay the same.
On the next deploy, products you haven't edited in /admin refresh from the seed. `npm run seed:reset` goes back to the seed list.
Categories and collections are defined in `src/store.js`.

## Deploy to Railway

1. Push this folder to a GitHub repo and create a Railway service from it (`railway.json` sets `npm start` and the `/health` check).
2. Variables:
   - `ADMIN_PASSWORD`: required to use `/admin`
   - `RESEND_API_KEY` (or `SMTP_URL`): sends the order emails. With neither, orders are saved and the email is only written to the logs.
   - `MAIL_FROM`: optional sender, default `Dapple Goods <hello@dapplegoods.ca>`
   - `ORDER_EMAIL`: where order emails go (default `hello@dapplegoods.ca`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: optional, for card payments
   - A Railway **volume** (picked up from `RAILWAY_VOLUME_MOUNT_PATH`, or set `DATA_DIR`) so products, orders and uploads survive redeploys
