"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/types";

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, subtotalCents, setQuantity, removeItem } = useCart();

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-chalk shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="font-display text-xl">Your cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm uppercase tracking-wider text-moss hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="font-display text-lg">Your cart is empty</p>
              <p className="text-sm text-moss">
                Browse the collection and add a piece you love.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 bg-forest px-5 py-2 text-xs font-semibold uppercase tracking-wider text-chalk"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-line">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="font-display">{item.title}</h3>
                    <p className="text-sm text-moss">{item.material}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.title}`}
                        onClick={() =>
                          setQuantity(item.productId, item.quantity - 1)
                        }
                        className="h-7 w-7 border border-line"
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.title}`}
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                        className="h-7 w-7 border border-line"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto text-xs uppercase tracking-wider text-clay hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(item.priceCents * item.quantity, item.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line p-5">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider text-sm text-moss">
                Subtotal
              </span>
              <span className="font-display text-xl">
                {formatPrice(subtotalCents)}
              </span>
            </div>
            <p className="mt-1 text-xs text-moss">
              Shipping calculated at checkout. Orders are recorded as pending.
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="mt-4 block w-full bg-forest py-3 text-center text-sm font-semibold uppercase tracking-wider text-chalk hover:opacity-90"
            >
              Go to checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
