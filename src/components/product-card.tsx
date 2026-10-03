"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-line">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {!product.inStock && (
          <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-xs uppercase tracking-wide text-chalk">
            Out of stock
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-1">
        <h3 className="font-display text-lg leading-snug">{product.title}</h3>
        <p className="text-sm text-moss">{product.material}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-sans font-semibold">
            {formatPrice(product.priceCents, product.currency)}
          </p>
          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => {
              addItem(product);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1600);
            }}
            className="border border-forest px-4 py-2 text-xs font-semibold uppercase tracking-wider text-forest transition-colors hover:bg-forest hover:text-chalk disabled:cursor-not-allowed disabled:border-line disabled:text-moss"
          >
            {added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
