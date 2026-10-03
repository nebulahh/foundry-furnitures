import Storefront from "@/components/storefront";
import { CartProvider } from "@/lib/cart";
import { getProducts } from "@/lib/products";
import { hasSupabaseConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  return (
    <CartProvider>
      <Storefront
        products={products}
        supabaseConfigured={hasSupabaseConfig()}
      />
    </CartProvider>
  );
}
