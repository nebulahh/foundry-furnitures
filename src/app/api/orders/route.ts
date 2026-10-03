import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/mailgun";

type IncomingItem = { productId?: unknown; quantity?: unknown };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(errors: Record<string, string>) {
  return NextResponse.json({ ok: false, errors }, { status: 400 });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { form: "Request body must be JSON." } },
      { status: 400 },
    );
  }

  const errors: Record<string, string> = {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const postalCode =
    typeof body.postalCode === "string" ? body.postalCode.trim() : "";
  const userId = typeof body.userId === "string" ? body.userId : null;

  if (!name) errors.name = "Please enter your name.";
  if (!email || !EMAIL_RE.test(email))
    errors.email = "Please enter a valid email address.";
  if (!address) errors.address = "Please enter a delivery address.";
  if (!city) errors.city = "Please enter a city.";
  if (!postalCode) errors.postalCode = "Please enter a postal code.";

  const items = Array.isArray(body.items) ? (body.items as IncomingItem[]) : [];
  const normalized = items
    .map((i) => ({
      productId: typeof i?.productId === "string" ? i.productId : "",
      quantity:
        typeof i?.quantity === "number" && Number.isInteger(i.quantity)
          ? i.quantity
          : 0,
    }))
    .filter((i) => i.productId && i.quantity > 0);

  if (items.length === 0 || normalized.length !== items.length) {
    errors.items = "Every cart line needs a product and a quantity of at least 1.";
  } else if (normalized.some((i) => i.quantity > 50)) {
    errors.items = "Single-line quantities are limited to 50.";
  } else if (normalized.length === 0) {
    errors.items = "Your cart is empty.";
  }

  if (Object.keys(errors).length > 0) return bad(errors);

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        errors: {
          form: "Ordering is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY, then apply supabase/schema.sql.",
        },
      },
      { status: 503 },
    );
  }

  const ids = normalized.map((i) => i.productId);
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,title,price_cents,currency,in_stock,active")
    .in("id", ids);

  if (productError) {
    return NextResponse.json(
      { ok: false, errors: { form: "Could not verify catalog items." } },
      { status: 502 },
    );
  }

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const unavailable = normalized.filter(
    (i) => !byId.has(i.productId) || !byId.get(i.productId)!.active,
  );
  if (unavailable.length > 0) {
    return bad({
      items: "Some items in your cart are no longer available. Please review your cart.",
    });
  }

  const outOfStock = normalized.filter((i) => !byId.get(i.productId)!.in_stock);
  if (outOfStock.length > 0) {
    return bad({ items: "Some items in your cart are out of stock." });
  }

  const currency = byId.get(normalized[0].productId)!.currency;
  const lines = normalized.map((i) => {
    const p = byId.get(i.productId)!;
    return {
      product_id: p.id,
      title: p.title,
      unit_price_cents: p.price_cents,
      quantity: i.quantity,
    };
  });

  const subtotal = lines.reduce(
    (n, l) => n + l.unit_price_cents * l.quantity,
    0,
  );
  const shipping = subtotal >= 150000 ? 0 : 4900;
  const total = subtotal + shipping;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      address,
      city,
      postal_code: postalCode,
      status: "pending",
      currency,
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: total,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { ok: false, errors: { form: "Could not save your order. Please try again." } },
      { status: 502 },
    );
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    lines.map((l) => ({ ...l, order_id: order.id })),
  );

  if (itemsError) {
    return NextResponse.json(
      { ok: false, errors: { form: "Could not save order items. Please try again." } },
      { status: 502 },
    );
  }

  const emailResult = await sendOrderConfirmation({
    to: email,
    customerName: name,
    orderId: order.id,
    lines: lines.map((l) => ({
      title: l.title,
      quantity: l.quantity,
      unitPriceCents: l.unit_price_cents,
    })),
    totalCents: total,
    currency,
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    totalCents: total,
    currency,
    emailSent: emailResult.sent,
    emailReason: emailResult.sent ? null : emailResult.reason,
  });
}
