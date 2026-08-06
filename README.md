# VeggieFlick — Farm Fresh. Delivered Fast.

Production-ready D2C fresh produce commerce platform for Chennai (25 km delivery radius), built with
**Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM · PostgreSQL**.

The storefront, customer account area, order tracking, and the role-based back office are all part of one
deployable application with a versioned REST API at `/api/v1`.

---

## 1. Quick start

```bash
npm install
cp .env.example .env          # or edit the existing .env
npx drizzle-kit push          # create all tables, enums and indexes
npx tsx src/db/seed.ts        # seed catalogue, slots, coupons, staff and demo data
npm run dev
```

| Variable | Purpose | Required |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | HMAC secret for signed JWT session cookies | recommended |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used in metadata, sitemap, robots | optional |
| `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET` | Live Razorpay order creation + signature verification | optional |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification | optional |
| `MSG91_API_KEY` / `MSG91_TEMPLATE_ID` | Transactional OTP SMS | optional |
| `RESEND_API_KEY` | Newsletter / transactional email | optional |
| `GOOGLE_MAPS_API_KEY` | Distance Matrix upgrade for delivery pricing | optional |
| `ADMIN_TOTP_CODE` | Enables mandatory 2FA on the staff portal | optional |

When an integration key is absent the platform degrades gracefully and stays fully testable — e.g. the OTP
endpoint returns an `otpPreview` field instead of sending an SMS, and payment order creation returns an
internal reference instead of calling Razorpay.

### Seeded accounts

| Role | Credentials |
| --- | --- |
| Super admin | `admin@veggieflick.in` / `Admin@12345` (staff portal `/admin/login`) |
| Manager | `manager@veggieflick.in` / `Manager@12345` |
| Warehouse staff | `warehouse@veggieflick.in` / `Warehouse@12345` |
| Customer | Sign in at `/login` with any 10-digit mobile (OTP is shown on screen) |

---

## 2. Architecture

```
src/
├─ app/
│  ├─ (storefront pages)  /  /shop  /product/[slug]  /cart  /checkout
│  │                      /orders  /orders/[id]  /account  /login
│  │                      /blog  /recipes  /about  /help  /legal/[slug]
│  ├─ admin/              layout (RBAC chrome) · dashboard · orders · catalog · login
│  └─ api/
│     ├─ health
│     ├─ v1/…             versioned REST surface (see below)
│     └─ webhooks/razorpay
├─ components/            header, footer, cart drawer, product cards, filters, providers
├─ db/                    schema.ts (28 tables + 9 enums), seed.ts
└─ lib/
   ├─ api.ts              consistent envelopes, pagination, error mapping
   ├─ auth.ts             JWT sessions, RBAC, scrypt passwords, OTP hashing
   ├─ validation.ts       Zod schemas for every request
   └─ services/           catalog · cart · order · delivery · analytics
```

**Layering rule:** route handlers only validate input and delegate; all business logic lives in
`lib/services`. Prices, discounts, delivery charges and taxes are always recalculated server-side —
client values are never trusted.

---

## 3. API reference (`/api/v1`)

All responses use the envelope `{ success: true, data, meta? }` or
`{ success: false, error: { code, message, details? } }`.

| Group | Endpoint | Methods |
| --- | --- | --- |
| Auth | `/auth/send-otp`, `/auth/verify-otp`, `/auth/admin-login`, `/auth/me`, `/auth/logout` | POST / GET / DELETE |
| Catalog | `/categories`, `/products`, `/products/{slug}`, `/products/search` | GET |
| Cart | `/cart` | GET (fetch) · POST (add) · PATCH (quantity) · DELETE (`?itemId=` removes, empty clears) |
| Coupon | `/coupon` | GET (active offers) · POST (apply) · DELETE (remove) |
| Checkout | `/checkout` | GET (addresses + slots + basket) · POST (place order, transactional) |
| Orders | `/orders`, `/orders/{id}` | GET · POST (`action: cancel \| reorder`) |
| Profile | `/profile/addresses` | GET · POST · DELETE (`?id=`) |
| Delivery | `/delivery?resource=slots\|radius\|track` | GET |
| Reviews | `/reviews?productId=` | GET · POST |
| Wishlist | `/wishlist` | GET · POST (toggle) · DELETE |
| Notifications | `/notifications` | GET · PATCH (mark read) |
| Payments | `/payments` | POST (create gateway order) · PUT (verify signature) |
| Content | `/content?type=blogs\|recipes` | GET |
| Newsletter | `/newsletter` | POST |
| Admin | `/admin` (KPIs), `/admin/orders`, `/admin/catalog`, `/admin/coupons` | GET / POST / PATCH / DELETE |
| Webhook | `/api/webhooks/razorpay` | POST (HMAC verified) |

Query parameters on `/products`: `page, limit, category, subCategory, search, minPrice, maxPrice, organic,
bestSeller, featured, freshToday, cut, inStock, minDiscount, minRating, sort`
(`popularity | newest | price_asc | price_desc | discount | rating`).

---

## 4. Data model

28 tables with UUID primary keys, `created_at` / `updated_at` / `deleted_at` timestamps and soft-delete
support, plus 9 Postgres enums (`status_enum`, `user_role_enum`, `payment_status_enum`, `order_status_enum`,
`delivery_status_enum`, `discount_type_enum`, `notification_type_enum`, `address_type_enum`,
`wallet_txn_type_enum`).

```
profiles ─┬─ addresses            categories ──< sub_categories
          ├─ carts ──< cart_items      │
          ├─ orders ─┬─< order_items   └──< products ─┬─< product_variants ── inventory
          │          ├── payments                     ├─< product_images
          │          ├─< order_timeline               └─< reviews
          │          └── delivery_assignments ── delivery_partners
          ├─ wallets ──< wallet_transactions      coupons · delivery_slots
          ├─ wishlists · notifications · referrals   blogs · recipes · gift_cards
          └─ audit_logs · newsletter_subscribers · otp_codes
```

Indexes cover every hot path: product slug/SKU/status/flags, category slug, cart lookups by profile and
guest token, order lookups by customer and status, inventory by variant, and time-ordered notifications.

---

## 5. Key business rules

* **Server-authoritative pricing.** Subtotal, coupon discount, GST and delivery charge are recomputed from
  the database inside the checkout transaction.
* **No overselling.** Inventory rows are locked with `SELECT … FOR UPDATE` before an order is written;
  stock moves from `available` to `reserved`, is released on delivery and restored on cancellation.
* **Delivery pricing.** ₹30 ≤ 5 km, ₹50 ≤ 10 km, ₹70 ≤ 15 km, ₹100 ≤ 25 km, free above ₹499. Addresses
  beyond 25 km from the Koyambedu hub are rejected at checkout.
* **Idempotent checkout.** An `idempotencyKey` is stored on the payment row; replays return the original
  order instead of duplicating it.
* **RBAC.** `super_admin`, `admin`, `manager`, `warehouse_staff`, `delivery_partner`, `customer` with a
  wildcard permission matrix (`products.*`, `orders.read`, …) enforced in every protected handler.
* **Auditability.** Staff actions (login, order status change, product create, inventory update, coupon
  create, webhook events) are written to `audit_logs`.

---

## 6. Front-end highlights

* Sticky header with marquee announcements, location selector, debounced instant search with suggestions,
  cart drawer, notification badge and role-aware profile menu.
* Mobile-first: bottom navigation, slide-up filter sheet, snap carousels, floating WhatsApp button and
  scroll-to-top.
* Motion via Framer Motion (staggered card reveals, drawer springs, toasts) with a full
  `prefers-reduced-motion` fallback.
* Accessibility: skip link, semantic landmarks, labelled controls, visible focus rings, `aria-live` toasts.
* SEO: per-page metadata and canonicals, JSON-LD for GroceryStore, Product, Recipe and FAQ, dynamic
  `sitemap.xml`, `robots.txt` and a PWA web manifest.

---

## 7. Operations

```bash
npm run dev         # local development
npm run build       # production build
npm run start       # production server
npm run lint        # ESLint
npm run typecheck   # TypeScript, no emit
```

Health probe: `GET /api/health` → `{ ok: true }`.

Deployment targets Vercel for the app and any managed PostgreSQL (Supabase, Neon, RDS) for data. Set the
environment variables above in the hosting dashboard, run `drizzle-kit push` against the target database as
part of the release pipeline, and configure the Razorpay webhook to `POST https://<host>/api/webhooks/razorpay`.
