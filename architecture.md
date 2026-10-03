# Architecture

## Stack
- Next.js App Router with TypeScript for the storefront, checkout route, and server-side integrations.
- Supabase Auth and PostgreSQL as the single hosted identity/data platform.
- Mailgun API for transactional order confirmation email.
- No payment processor in this first release; a successful checkout records a pending order for follow-up.

## Main Flows
1. Storefront reads catalog products from Supabase when configured. Public catalog rows may be read by anonymous visitors.
2. Cart contents are stored in browser local storage for a fast, persistent guest shopping flow. The browser stores product identifiers and quantities; prices are recalculated using trusted catalog rows when an order is submitted.
3. Google sign-in uses Supabase OAuth. Google Cloud Console credentials are configured in Supabase Auth; no Google secret is shipped to the client.
4. Checkout posts contact, delivery, and cart data to a server route. The server validates fields and quantities, fetches authoritative active product prices, computes totals, and inserts the order and order lines.
5. After insertion, server-side Mailgun sends a confirmation email. A delivery error is logged/returned as a non-blocking email status; the persisted order remains valid.

## Data Model
- `products`: public catalog rows with slug, title, description, category, image URL, price in minor currency units, material, inventory status, and active flag.
- `profiles`: user profile keyed to `auth.users`, optional display name and email.
- `orders`: customer/contact and delivery snapshot, status (`pending` initially), currency, subtotal, shipping, total, and timestamps. Authenticated orders reference the user; guest orders keep `user_id` null.
- `order_items`: immutable product title/price/quantity snapshot linked to an order.

Use database constraints and Row Level Security. Public visitors can select active products. Authenticated users can select their own profile and orders. Anonymous order creation happens through a server-only Supabase service role route; privileged credentials never reach browser code. Do not permit clients to update order totals or status.

## Environment
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `MAILGUN_API_KEY` (server only)
- `MAILGUN_DOMAIN`
- `MAILGUN_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

## External Setup
1. Create a Supabase project and apply `supabase/schema.sql` (including its catalog seed rows).
2. In Supabase Auth, enable Google and enter the OAuth client ID/secret from Google Cloud Console. Add the Supabase callback URL to Google's authorized redirect URIs; add local and production origins/redirect URLs in Supabase.
3. Create/verify a Mailgun sending domain, configure DNS, and supply a sender address authorized for that domain.
4. Copy `.env.example` to `.env.local` and set the project credentials. The app must clearly communicate missing setup instead of pretending the integrations are live.

## Boundaries and Risks
- No card payment is collected. Order status starts as `pending` and payment is not represented as completed.
- A Mailgun outage does not roll back an order. Email status is distinct from order persistence.
- Service-role access is restricted to server routes and must be protected by validation and rate limiting before public production launch.
- Supabase Auth manages sessions; user-specific history is only available after sign-in. Guest checkout remains available.
