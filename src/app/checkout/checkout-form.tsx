"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/types";
import { getBrowserSupabase } from "@/lib/supabase/client";

type FieldErrors = Record<string, string>;

export default function CheckoutForm() {
  const { items, clear, hydrated } = useCart();
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { kind: "success"; orderId: string; totalCents: number; currency: string; emailSent: boolean; emailReason: string | null }
    | { kind: "error"; message: string }
    | null
  >(null);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setResult(null);
    setSubmitting(true);

    let userId: string | null = null;
    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id ?? null;
      }
    } catch {
      userId = null;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          userId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({
          kind: "success",
          orderId: data.orderId,
          totalCents: data.totalCents,
          currency: data.currency,
          emailSent: data.emailSent,
          emailReason: data.emailReason,
        });
        clear();
      } else {
        setErrors(data.errors ?? {});
        setResult({
          kind: "error",
          message:
            data.errors?.form ??
            "Please review the highlighted fields and try again.",
        });
      }
    } catch {
      setResult({
        kind: "error",
        message: "Network error — your order was not submitted. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.kind === "success") {
    return (
      <div className="border border-forest/40 bg-forest/5 p-8">
        <h2 className="font-display text-3xl">Order received</h2>
        <p className="mt-3 text-moss">
          Thank you. Your order request{" "}
          <strong className="text-ink">#{result.orderId.slice(0, 8)}</strong>{" "}
          is recorded as <em>pending</em> — no payment has been collected.
          Total:{" "}
          <strong className="text-ink">
            {formatPrice(result.totalCents, result.currency)}
          </strong>
          .
        </p>
        {result.emailSent ? (
          <p className="mt-3 text-sm text-forest">
            A confirmation email is on its way to your inbox.
          </p>
        ) : (
          <p className="mt-3 text-sm text-clay">
            Your order is saved, but the confirmation email could not be sent
            {result.emailReason ? ` (${result.emailReason})` : ""}. Please check
            the Mailgun configuration.
          </p>
        )}
        <Link
          href="/"
          className="mt-6 inline-block border border-forest px-6 py-2 text-xs font-semibold uppercase tracking-wider text-forest"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="border border-line p-8 text-center">
        <h2 className="font-display text-2xl">Your cart is empty</h2>
        <p className="mt-2 text-moss">
          Add a piece from the collection before checking out.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-forest px-6 py-3 text-sm font-semibold uppercase tracking-wider text-chalk"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field
        label="Full name"
        name="name"
        value={values.name}
        error={errors.name}
        onChange={(v) => setValues({ ...values, name: v })}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        value={values.email}
        error={errors.email}
        onChange={(v) => setValues({ ...values, email: v })}
      />
      <Field
        label="Phone (optional)"
        name="phone"
        type="tel"
        value={values.phone}
        error={errors.phone}
        onChange={(v) => setValues({ ...values, phone: v })}
      />
      <Field
        label="Delivery address"
        name="address"
        value={values.address}
        error={errors.address}
        onChange={(v) => setValues({ ...values, address: v })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="City"
          name="city"
          value={values.city}
          error={errors.city}
          onChange={(v) => setValues({ ...values, city: v })}
        />
        <Field
          label="Postal code"
          name="postalCode"
          value={values.postalCode}
          error={errors.postalCode}
          onChange={(v) => setValues({ ...values, postalCode: v })}
        />
      </div>

      {Object.keys(errors)
        .filter((k) => !["name", "email", "phone", "address", "city", "postalCode"].includes(k))
        .map((k) => (
          <p key={k} className="text-sm text-clay" role="alert">
            {errors[k]}
          </p>
        ))}
      {result?.kind === "error" && (
        <p className="text-sm text-clay" role="alert">
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || items.length === 0}
        className="mt-2 bg-forest py-3 text-sm font-semibold uppercase tracking-wider text-chalk hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Placing order…" : "Place order request"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  error,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-moss">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`border bg-chalk px-4 py-2.5 text-sm focus:outline-none ${
          error ? "border-clay" : "border-line focus:border-forest"
        }`}
      />
      {error && (
        <span id={`${name}-error`} className="text-xs text-clay" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
