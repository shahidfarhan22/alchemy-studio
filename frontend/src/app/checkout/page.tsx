"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getCart } from "@/lib/cart-api";
import type { CartDto } from "@/lib/cart-api";
import { createOrder } from "@/lib/orders-api";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { Button } from "@/components/ui/Button";
import { LineItemRow } from "@/components/catalog/LineItemRow";
import { AddressPicker } from "@/components/commerce/AddressPicker";

export default function CheckoutPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Login gate: docs/decisions.md ADR-011 -- guests can add to cart freely,
  // but must be logged in to reach checkout.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  const [cart, setCart] = useState<CartDto | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCart().then(setCart).catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load cart."));
  }, [user]);

  if (authLoading || !user) {
    return (
      <main className="flex-1 py-16">
        <Container>
          <p className="text-muted font-sans">Loading…</p>
        </Container>
      </main>
    );
  }

  async function handlePayment() {
    if (!selectedAddressId) return;
    setError(null);
    setIsPaying(true);

    try {
      const order = await createOrder(selectedAddressId);

      await openRazorpayCheckout({
        key: order.razorpayKeyId,
        amount: order.amountInPaise,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Alchemy Studio",
        prefill: { name: user!.displayName, email: user!.email },
        handler: () => {
          // This callback is UX-only -- it just tells us to go watch for the
          // real confirmation. The order page polls the backend, which only
          // ever changes status once Razorpay's webhook confirms payment
          // (docs/architecture.md: webhooks are the source of truth, not
          // the redirect/callback).
          router.push(`/orders/${order.orderId}`);
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start payment. Please try again.");
      setIsPaying(false);
    }
  }

  return (
    <main className="flex-1 py-16">
      <Container>
        <PageHeading className="mb-8">Checkout</PageHeading>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <section className="mt-8">
          <EyebrowLabel as="h2" className="block mb-4">
            Order summary
          </EyebrowLabel>
          {cart === null ? (
            <p className="text-muted font-sans text-sm">Loading…</p>
          ) : (
            <>
              <ul className="divide-y divide-hairline">
                {cart.items.map((item) => (
                  <LineItemRow
                    key={item.productId}
                    name={item.productName}
                    subtitle={`Qty ${item.quantity}`}
                    right={<span className="text-text">{formatPrice(item.lineTotalInPaise, item.currency)}</span>}
                  />
                ))}
              </ul>
              <HairlineRule variant="gold" className="mt-4" />
              <div className="mt-4 flex justify-between items-baseline">
                <span className="font-serif text-lg">Subtotal</span>
                <span className="font-serif text-lg">{formatPrice(cart.subtotalInPaise, cart.currency)}</span>
              </div>
            </>
          )}
        </section>

        <section className="mt-12">
          <EyebrowLabel as="h2" className="block mb-4">
            Shipping address
          </EyebrowLabel>
          <AddressPicker selectedAddressId={selectedAddressId} onChange={setSelectedAddressId} />
        </section>

        <div className="mt-12">
          <Button
            onClick={handlePayment}
            disabled={isPaying || !selectedAddressId || !cart || cart.items.length === 0}
            fullWidth
          >
            {isPaying ? "Opening payment…" : "Continue to payment"}
          </Button>
        </div>
      </Container>
    </main>
  );
}
