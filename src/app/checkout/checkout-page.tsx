"use client";

import Image from "next/image";
import Link from "next/link";
import CheckoutForm from "./checkout-form";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/types";

export default function CheckoutPage() {
  const { items, subtotalCents } = useCart();
  const shipping = subtotalCents >= 150000 || subtotalCents === 0 ? 0 : 4900;
  const total = subtotalCents + shipping;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <Link
        href="/"
        className="text-xs uppercase tracking-widest text-moss hover:text-ink"
      >
        ← Back to the shop
      </Link>
      <h1 className="mt-4 font-display text-4xl">Checkout</h1>
      <p className="mt-2 max-w-xl text-moss">
        Complete your details below. Submitting records a pending order request
        — no payment is collected online, and a confirmation email follows
        once the order is saved.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_380px]">
        <CheckoutForm />

        <aside className="border border-line bg-white/40 p-6">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-line">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-display">{item.title}</p>
                  <p className="text-xs text-moss">
                    Qty {item.quantity} · {item.material}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatPrice(item.priceCents * item.quantity, item.currency)}
                </p>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-sm text-moss">No items yet.</li>
            )}
          </ul>
          <dl className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-moss">Subtotal</dt>
              <dd>{formatPrice(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-moss">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-display">Total</dt>
              <dd className="font-display text-lg">{formatPrice(total)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-moss">
            Final totals are recalculated on the server from the catalog before
            the order is saved.
          </p>
        </aside>
      </div>
    </main>
  );
}
