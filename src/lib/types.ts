export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  priceCents: number;
  currency: string;
  material: string;
  inStock: boolean;
};

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  material: string;
  priceCents: number;
  currency: string;
  quantity: number;
};

export const CATEGORIES = [
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Office",
  "Outdoor",
  "Decor",
] as const;

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
