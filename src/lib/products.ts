import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseConfig } from "./env";
import { sampleProducts } from "./catalog";
import type { Product } from "./types";

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  price_cents: number;
  currency: string;
  material: string;
  in_stock: boolean;
  active: boolean;
};

export const getProducts = cache(async (): Promise<Product[]> => {
  if (!hasSupabaseConfig()) return sampleProducts;
  try {
    const supabase = createClient(
      env.supabaseUrl!,
      env.supabaseAnonKey!,
      { auth: { persistSession: false } },
    );
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,slug,title,description,category,image_url,price_cents,currency,material,in_stock,active",
      )
      .eq("active", true)
      .order("title");
    if (error || !data || data.length === 0) return sampleProducts;
    return (data as Row[]).map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      category: r.category,
      imageUrl: r.image_url,
      priceCents: r.price_cents,
      currency: r.currency,
      material: r.material,
      inStock: r.in_stock,
    }));
  } catch {
    return sampleProducts;
  }
});
