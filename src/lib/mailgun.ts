import { env, hasMailgunConfig, siteUrl } from "./env";
import { formatPrice } from "./types";

type OrderEmail = {
  to: string;
  customerName: string;
  orderId: string;
  lines: { title: string; quantity: number; unitPriceCents: number }[];
  totalCents: number;
  currency: string;
};

export type EmailResult =
  | { sent: true }
  | { sent: false; reason: string };

export async function sendOrderConfirmation(
  order: OrderEmail,
): Promise<EmailResult> {
  if (!hasMailgunConfig()) {
    return { sent: false, reason: "Mailgun is not configured" };
  }

  const rows = order.lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 12px">${escapeHtml(l.title)}</td>` +
        `<td style="padding:6px 12px;text-align:center">${l.quantity}</td>` +
        `<td style="padding:6px 12px;text-align:right">${formatPrice(
          l.unitPriceCents * l.quantity,
          order.currency,
        )}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;color:#252922;max-width:560px;margin:auto">
      <h1 style="font-size:24px">Thank you, ${escapeHtml(order.customerName)}.</h1>
      <p>We received your order request <strong>#${order.orderId.slice(0, 8)}</strong>.
      This order is recorded as <em>pending</em> — no payment has been collected.
      Our team will contact you to confirm delivery and payment details.</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid #E2E0D9">
          <th style="text-align:left;padding:6px 12px">Item</th>
          <th style="padding:6px 12px">Qty</th>
          <th style="text-align:right;padding:6px 12px">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align:right;font-size:18px"><strong>Order total: ${formatPrice(
        order.totalCents,
        order.currency,
      )}</strong></p>
      <p style="font-size:12px;color:#78836A">FurniLux · ${siteUrl}</p>
    </div>`;

  const text =
    `Thank you, ${order.customerName}.\n\n` +
    `We received your order #${order.orderId} (pending; no payment collected).\n\n` +
    order.lines
      .map(
        (l) =>
          `${l.title} x${l.quantity} — ${formatPrice(
            l.unitPriceCents * l.quantity,
            order.currency,
          )}`,
      )
      .join("\n") +
    `\n\nOrder total: ${formatPrice(order.totalCents, order.currency)}`;

  try {
    const body = new URLSearchParams();
    body.set("from", env.mailgunFrom!);
    body.set("to", order.to);
    body.set("subject", "Your FurniLux order request");
    body.set("text", text);
    body.set("html", html);

    const res = await fetch(
      `${env.mailgunApiBase}/v3/${env.mailgunDomain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${env.mailgunApiKey}`,
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return { sent: false, reason: `Mailgun error ${res.status}: ${detail}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
