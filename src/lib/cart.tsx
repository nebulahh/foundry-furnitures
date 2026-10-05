"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "./types";
import { getBrowserSupabase } from "./supabase/client";

const STORAGE_KEY = "furnilux-cart-v1";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  hydrated: boolean;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function parseItems(value: unknown): CartItem[] {
  if (Array.isArray(value)) return value as CartItem[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function merge(local: CartItem[], remote: CartItem[]): CartItem[] {
  const byId = new Map<string, CartItem>();
  for (const r of remote) byId.set(r.productId, { ...r });
  for (const l of local) {
    const ex = byId.get(l.productId);
    byId.set(
      l.productId,
      ex ? { ...ex, quantity: Math.max(ex.quantity, l.quantity) } : { ...l },
    );
  }
  return [...byId.values()];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage (guests) once.
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(
              parsed.filter(
                (i): i is CartItem =>
                  i &&
                  typeof i.productId === "string" &&
                  typeof i.quantity === "number" &&
                  i.quantity > 0,
              ),
            );
          }
        }
      } catch {
        // ignore corrupt storage
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Track auth state.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      console.log("[cart] user:", data.user?.id ?? null);
      setUserId(data.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => setUserId(session?.user?.id ?? null),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // On sign-in: load the shared cart and merge with any local items.
  useEffect(() => {
    if (!userId) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase
      .from("carts")
      .select("items")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        console.log("[cart] remote load:", error ?? `${parseItems(data?.items).length} items`);
        setItems((local) => merge(local, parseItems(data?.items)));
      });
  }, [userId]);

  // Refetch the shared cart when the tab regains focus (mobile edits appear).
  useEffect(() => {
    if (!userId) return;
    const onFocus = () => {
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      supabase
        .from("carts")
        .select("items")
        .eq("user_id", userId)
        .maybeSingle()
        .then(({ data }) => {
          setItems(parseItems(data?.items));
        });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [userId]);

  // Persist locally, and remotely (debounced) when signed in.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage may be unavailable
    }
    const supabase = getBrowserSupabase();
    if (userId && supabase) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        supabase
          .from("carts")
          .upsert({
            user_id: userId,
            items,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) console.error("[cart sync] upsert failed:", error);
            else console.log("[cart sync] upserted", items.length, "items");
          });
      }, 500);
    }
  }, [items, hydrated, userId]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          imageUrl: product.imageUrl,
          material: product.material,
          priceCents: product.priceCents,
          currency: product.currency,
          quantity,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((n, i) => n + i.quantity, 0);
    const subtotalCents = items.reduce(
      (n, i) => n + i.priceCents * i.quantity,
      0,
    );
    return {
      items,
      itemCount,
      subtotalCents,
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [items, hydrated, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
