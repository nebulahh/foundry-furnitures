-- FurniLux schema: catalog, profiles, orders, order items.
-- Apply in the Supabase SQL editor. Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).

create extension if not exists "pgcrypto";

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category text not null,
  image_url text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  material text not null default '',
  in_stock boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- carts (cross-device sync for signed-in users) ----------
create table if not exists public.carts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.carts enable row level security;

drop policy if exists "users read own cart" on public.carts;
create policy "users read own cart"
  on public.carts for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own cart" on public.carts;
create policy "users insert own cart"
  on public.carts for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own cart" on public.carts;
create policy "users update own cart"
  on public.carts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  address text not null,
  city text not null,
  postal_code text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  currency text not null default 'USD',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0)
);

-- ---------- row level security ----------
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public can read active products" on public.products;
create policy "public can read active products"
  on public.products for select
  using (active = true);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "users read own order items" on public.order_items;
create policy "users read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- No client insert/update/delete policies: order creation only via the
-- server route using the service role key, which bypasses RLS.

-- ---------- seed catalog ----------
insert into public.products (slug, title, description, category, image_url, price_cents, currency, material, in_stock, active)
values
  ('modern-fabric-sofa', 'Modern Fabric Sofa', 'A deep, low-slung sofa in moss bouclé with solid ash feet.', 'Living Room', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop', 79900, 'USD', 'Bouclé, solid ash', true, true),
  ('accent-lounge-chair', 'Accent Lounge Chair', 'Sculpted lounge chair in natural linen with a kiln-dried oak frame.', 'Living Room', 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1200&auto=format&fit=crop', 27900, 'USD', 'Linen, oak', true, true),
  ('storage-bed-frame', 'Storage Bed Frame', 'Platform bed with under-bed drawers and soft-close hardware.', 'Bedroom', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop', 74900, 'USD', 'Oak veneer', true, true),
  ('linen-duvet-set', 'Washed Linen Duvet Set', 'Stone-washed European flax linen that softens with every wash.', 'Bedroom', 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=1200&auto=format&fit=crop', 18900, 'USD', 'European flax linen', true, true),
  ('wooden-dining-table-set', 'Wooden Dining Table Set', 'Six-seat dining set in oiled solid walnut.', 'Dining Room', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1200&auto=format&fit=crop', 59900, 'USD', 'Solid walnut', true, true),
  ('ceramic-dinnerware', 'Hand-Thrown Dinnerware Set', 'A set for four in reactive-glaze stoneware.', 'Dining Room', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1200&auto=format&fit=crop', 9800, 'USD', 'Stoneware', true, true),
  ('ergonomic-office-chair', 'Ergonomic Office Chair', 'Breathable mesh back with adjustable lumbar support.', 'Office', 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=1200&auto=format&fit=crop', 34900, 'USD', 'Mesh, aluminium', true, true),
  ('modern-bookshelf', 'Modern Bookshelf', 'Open shelving in matte black steel and oak.', 'Office', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop', 22900, 'USD', 'Oak, steel', true, true),
  ('outdoor-lounge-set', 'Outdoor Lounge Chair', 'Teak-framed lounge chair with weatherproof cushions.', 'Outdoor', 'https://images.unsplash.com/photo-1567016432779-094069958ea5?q=80&w=1200&auto=format&fit=crop', 45900, 'USD', 'Teak, weatherproof fabric', true, true),
  ('round-coffee-table', 'Round Coffee Table', 'Nested-height round table in travertine and blackened steel.', 'Living Room', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1200&auto=format&fit=crop', 19900, 'USD', 'Travertine, steel', true, true),
  ('ceramic-table-vase', 'Ceramic Table Vase', 'Matte-glaze ceramic vase in a warm clay tone.', 'Decor', 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=1200&auto=format&fit=crop', 4200, 'USD', 'Ceramic', true, true),
  ('woven-wool-rug', 'Woven Wool Rug', 'Hand-loomed wool rug with a quiet geometric border, 5x8 ft.', 'Decor', 'https://images.unsplash.com/photo-1600166898405-da9535204843?q=80&w=1200&auto=format&fit=crop', 32900, 'USD', 'Wool', true, true)
on conflict (slug) do nothing;
