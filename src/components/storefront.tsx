"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AuthButton from "./auth-button";
import CartDrawer from "./cart-drawer";
import ProductCard from "./product-card";
import { useCart } from "@/lib/cart";
import { CATEGORIES, type Product } from "@/lib/types";

export default function Storefront({
  products,
  supabaseConfigured,
}: {
  products: Product[];
  supabaseConfigured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-chalk/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="font-display text-2xl tracking-tight">
            Furni<span className="text-forest">Lux</span>.
          </Link>
          <div className="flex items-center gap-4">
            <AuthButton />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart, ${itemCount} items`}
              className="relative border border-forest px-4 py-2 text-xs font-semibold uppercase tracking-wider text-forest"
            >
              Cart
              <span className="ml-2 bg-forest px-1.5 py-0.5 text-chalk" aria-live="polite">
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 md:grid-cols-2 md:py-16">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-clay">
              Timeless design, endless comfort
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
              Furniture that elevates your everyday
            </h1>
            <p className="mt-5 max-w-md text-moss">
              Premium furniture crafted for beautiful spaces and better living —
              from solid oak dining tables to washed-linen bedding.
            </p>
            <a
              href="#collection"
              className="mt-8 inline-block bg-forest px-8 py-3 text-sm font-semibold uppercase tracking-wider text-chalk hover:opacity-90"
            >
              Shop now
            </a>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-line">
            <Image
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1400&auto=format&fit=crop"
              alt="A warm living room with a linen sofa and oak furniture"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </section>

        <section className="border-t border-line bg-white/40">
          <div className="mx-auto max-w-6xl px-5 py-10" id="collection">
            {!supabaseConfigured && (
              <div
                role="status"
                className="mb-8 border border-clay/50 bg-clay/10 p-4 text-sm text-ink"
              >
                <strong>Setup notice:</strong> Supabase is not configured, so
                you are browsing bundled sample pieces. Checkout and sign-in
                will report a clear error until the environment variables in{" "}
                <code className="font-mono text-xs">.env.example</code> are set
                and <code className="font-mono text-xs">supabase/schema.sql</code>{" "}
                is applied.
              </div>
            )}

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <h2 className="font-display text-3xl">The collection</h2>
              <label className="w-full md:max-w-xs">
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sofas, oak, linen…"
                  className="w-full border border-line bg-chalk px-4 py-2 text-sm focus:border-forest focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {["All", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={`border px-4 py-1.5 text-xs uppercase tracking-wider ${
                    category === c
                      ? "border-forest bg-forest text-chalk"
                      : "border-line text-moss hover:border-forest hover:text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="py-16 text-center text-moss">
                No pieces match your search. Try another material or category.
              </p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-xs uppercase tracking-widest text-moss md:flex-row">
          <p>FurniLux — Furniture & Interior Decoration</p>
          <p>Orders are recorded as pending. No payment is collected online.</p>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
