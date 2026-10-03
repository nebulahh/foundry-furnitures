import type { Metadata } from "next";
import CheckoutPage from "./checkout-page";
import { CartProvider } from "@/lib/cart";

export const metadata: Metadata = {
  title: "Checkout — FurniLux",
};

export default function Checkout() {
  return (
    <CartProvider>
      <CheckoutPage />
    </CartProvider>
  );
}
