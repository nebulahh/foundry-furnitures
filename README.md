# FurniLux

A responsive furniture and interior decoration storefront built with Next.js (App Router), Supabase (Auth + Postgres), and Mailgun.

## Features

- Storefront with hero, category browsing, search, and product grid
- Persistent cart (local storage) with quantity updates and subtotal
- Checkout with server-side validation; totals are recomputed from catalog rows
- Google sign-in via Supabase OAuth (Google Cloud Console credentials)
- Order confirmation emails via Mailgun (server-side only)
- Graceful setup states when environment variables are missing

Orders are recorded as `pending`. No payment is collected.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Without Supabase env vars the storefront browses a bundled sample catalog and clearly reports that checkout/auth are not configured. To enable the full flow:

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor (creates tables, RLS policies, and seed products).
2. In Supabase Auth → Providers, enable Google and paste the OAuth client ID/secret from Google Cloud Console. Add `https://<project>.supabase.co/auth/v1/callback` to the Google client's authorized redirect URIs, and add your local/production site URLs in Supabase.
3. Verify a sending domain in Mailgun and configure DNS.
4. Fill in `.env.local` from `.env.example`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

## Structure

- `src/app` — routes: storefront `/`, `/checkout`, `/api/orders`, `/auth/callback`
- `src/components` — storefront, product card, cart drawer, auth button
- `src/lib` — env helpers, catalog fallback, cart store, Supabase clients, Mailgun sender, product queries
- `supabase/schema.sql` — database schema, RLS policies, seed data

See `prd.md`, `architecture.md`, `style.md`, `taste.md`, and `AGENT.md` for the product and engineering requirements this build follows.
