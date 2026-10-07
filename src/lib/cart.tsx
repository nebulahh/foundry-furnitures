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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const localRevision = useRef(0);
  const committedRevision = useRef(0);
  const operationQueue = useRef<Promise<void>>(Promise.resolve());
  const itemsRef = useRef(items);
  const userIdRef = useRef(userId);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(parsed.filter((i) => i && typeof i.productId === "string" && typeof i.quantity === "number" && i.quantity > 0));
          }
        }
      } catch {
        // Ignore corrupt storage.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUserId(session?.user?.id ?? null),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated || !userId) {
      setLoadedUserId(null);
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    setLoadedUserId(null);
    supabase
      .from("carts")
      .select("items")
      .eq("user_id", userId)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[cart] remote load failed:", error.message);
          return;
        }
        let canonicalItems: CartItem[];
        if (data) {
          canonicalItems = parseItems(data.items);
        } else {
          const { data: initialized, error: initError } = await supabase.rpc(
            "mutate_cart",
            { p_action: "initialize", p_items: itemsRef.current },
          );
          if (cancelled) return;
          if (initError) {
            console.error("[cart] initialize failed:", initError.message);
            return;
          }
          canonicalItems = parseItems(initialized);
        }
        committedRevision.current = localRevision.current;
        setItems(canonicalItems);
        setLoadedUserId(userId);
      });
    return () => { cancelled = true; };
  }, [userId, hydrated]);

  useEffect(() => {
    if (!userId || loadedUserId !== userId) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("carts-updates")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "carts",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (localRevision.current > committedRevision.current) return;
        const row = payload.new as Record<string, unknown>;
        committedRevision.current = localRevision.current;
        setItems(parseItems(row?.items));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadedUserId]);

  useEffect(() => {
    if (!userId || loadedUserId !== userId) return;
    const onFocus = () => {
      if (localRevision.current > committedRevision.current) return;
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      supabase
        .from("carts")
        .select("items")
        .eq("user_id", userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || localRevision.current > committedRevision.current) return;
          committedRevision.current = localRevision.current;
          setItems(parseItems(data?.items));
        });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [userId, loadedUserId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be unavailable.
    }
  }, [items, hydrated]);

  const enqueueMutation = useCallback((
    action: "add" | "set_quantity" | "remove" | "clear",
    productId: string | null,
    item: CartItem | null,
    quantity: number | null,
    update: (current: CartItem[]) => CartItem[],
  ) => {
    const revision = ++localRevision.current;
    setItems(update);
    const ownerId = userId;
    const supabase = getBrowserSupabase();
    if (!ownerId || loadedUserId !== ownerId || !supabase) return;

    // Preserve this device's action order; the SQL mutation itself is atomic
    // with respect to operations arriving from the other platform.
    operationQueue.current = operationQueue.current
      .catch(() => {})
      .then(async () => {
        if (userIdRef.current !== ownerId) return;
        const { data, error } = await supabase.rpc("mutate_cart", {
          p_action: action,
          p_product_id: productId,
          p_item: item,
          p_quantity: quantity,
        });
        if (error) {
          console.error("[cart] mutation failed:", error.message);
          return;
        }
        committedRevision.current = Math.max(committedRevision.current, revision);
        if (revision === localRevision.current && userIdRef.current === ownerId) {
          setItems(parseItems(data));
        }
      });
  }, [userId, loadedUserId]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const item: CartItem = {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: product.imageUrl,
      material: product.material,
      priceCents: product.priceCents,
      currency: product.currency,
      quantity,
    };
    enqueueMutation("add", product.id, item, quantity, (current) => {
      const existing = current.find((i) => i.productId === product.id);
      return existing
        ? current.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...current, item];
    });
  }, [enqueueMutation]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    enqueueMutation("set_quantity", productId, null, quantity, (current) =>
      quantity <= 0
        ? current.filter((i) => i.productId !== productId)
        : current.map((i) => i.productId === productId ? { ...i, quantity } : i),
    );
  }, [enqueueMutation]);

  const removeItem = useCallback((productId: string) => {
    enqueueMutation("remove", productId, null, null, (current) =>
      current.filter((i) => i.productId !== productId),
    );
  }, [enqueueMutation]);

  const clear = useCallback(() => {
    enqueueMutation("clear", null, null, null, () => []);
  }, [enqueueMutation]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotalCents: items.reduce((n, i) => n + i.priceCents * i.quantity, 0),
    hydrated,
    addItem,
    setQuantity,
    removeItem,
    clear,
  }), [items, hydrated, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
