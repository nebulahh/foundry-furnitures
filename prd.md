# FurniLux Product Requirements

## Product Summary
Build a responsive furniture and interior decoration storefront for discovering a curated home collection, managing a persistent cart, and submitting an order request. The visual reference informs the category-led browsing and product merchandising; the product should have its own warmer editorial identity.

## Audience
People furnishing a home or room who value considered design, trustworthy product information, and a straightforward ordering experience.

## Goals
- Make the brand, collection, and primary shopping path clear at first glance.
- Support product discovery by category and search.
- Let visitors keep a cart across refreshes and complete a guest or Google-authenticated checkout.
- Persist catalog, customer profile, and order data in Supabase.
- Send a confirmation email through Mailgun after a successful order insert.

## Non-goals
- Card processing, tax calculation, live shipping quotes, inventory reservation, refunds, admin tooling, or order tracking.
- Claiming an order is paid. Orders are recorded as `pending`.

## MVP Scope
- Responsive home/storefront with hero, category navigation, searchable/filterable product collection, product details, and product cards.
- Persistent client-side cart with quantity updates, removal, item count, and subtotal.
- Checkout page with contact email, name, phone (optional), delivery address, city, postal code, and order summary.
- Google sign-in through Supabase Auth; guest checkout remains available.
- Server-validated order submission; authoritative prices and order lines persisted to Supabase.
- Mailgun confirmation email sent after persistence, with honest success and email-failure feedback.
- Useful setup documentation and schema/seed SQL.

## User Stories
- As a shopper, I can browse by room/category and search products so I can find suitable furniture.
- As a shopper, I can add products and change quantities so my cart reflects what I intend to order.
- As a shopper, I can refresh or return without losing my cart.
- As a shopper, I can check out as a guest or sign in with Google.
- As a shopper, I can review delivery details and the exact order total before submitting.
- As a shopper, I receive clear confirmation only after the order is saved, and know if email delivery could not be completed.

## Acceptance Criteria
- Primary storefront, category links, search, cart, and checkout controls work on mobile and desktop.
- Prices and totals are formatted consistently; checkout totals are recalculated from Supabase product records, not trusted from the browser.
- Invalid contact/address/cart data is rejected with actionable inline feedback.
- Missing server configuration produces an explicit error and never a false order confirmation.
- Persisted orders begin in `pending`; order items retain the purchased product name and unit price snapshot.
- Google auth uses Supabase OAuth and Google Cloud Console credentials configured externally.
- Mailgun credentials remain server-side; email failure does not erase an order.
- Database tables use appropriate constraints and row-level security.

## Delivery Checklist
- [ ] Create Supabase project, configure environment variables, and apply the SQL schema/seed.
- [ ] Enable Google OAuth in Google Cloud Console and Supabase; configure callback URLs.
- [ ] Configure and verify Mailgun domain/sender.
- [ ] Build storefront and responsive visual system.
- [ ] Implement catalog/search/category browsing.
- [ ] Implement persistent cart and checkout form.
- [ ] Implement server-side order validation, persistence, and Mailgun confirmation.
- [ ] Run lint/typecheck/production build and verify key responsive flows.
- [ ] Add production hardening for rate limiting, monitoring, and a real payment provider before accepting online payment.
