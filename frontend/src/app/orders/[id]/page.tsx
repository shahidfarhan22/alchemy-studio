"use client";

import { use, useEffect, useState } from "react";
import { getOrder } from "@/lib/orders-api";
import type { OrderDetailDto } from "@/lib/orders-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { Button } from "@/components/ui/Button";
import { LineItemRow } from "@/components/catalog/LineItemRow";

// Order status only ever comes from the backend, driven by Razorpay's
// webhook -- this page polls rather than trusting anything the checkout
// widget's client-side callback claimed (docs/architecture.md).
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const result = await getOrder(id);
        if (cancelled) return;
        setOrder(result);
        if (result.status === "PendingPayment") {
          pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load order status.");
      }
    }

    poll();
    const timeoutTimer = setTimeout(() => setHasTimedOut(true), POLL_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      clearTimeout(timeoutTimer);
    };
  }, [id]);

  if (error) {
    return (
      <main className="flex-1 py-16 text-center">
        <p className="text-danger font-sans">{error}</p>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="flex-1 py-16 text-center">
        <p className="text-muted font-sans">Loading…</p>
      </main>
    );
  }

  const timedOut = order.status === "PendingPayment" && hasTimedOut;

  return (
    <main className="flex-1 py-16">
      <Container size="sm" className="text-center">
        {/* Status changes async as the poll resolves, with no user action in
            between -- announce it to screen readers, not just sighted users. */}
        <div aria-live="polite">
          {order.status === "Paid" && (
            <>
              <h1 className="font-serif text-3xl text-success mb-3">Payment successful</h1>
              <p className="text-muted font-sans mb-8">Thanks for your order.</p>
            </>
          )}

          {order.status === "PendingPayment" && !timedOut && (
            <>
              <h1 className="font-serif text-2xl mb-3">Confirming your payment…</h1>
              <p className="text-muted font-sans mb-8">This usually takes a few seconds.</p>
            </>
          )}

          {(order.status === "PaymentFailed" || timedOut) && (
            <>
              <h1 className="font-serif text-2xl text-danger mb-3">
                {timedOut ? "Still waiting on confirmation" : "Payment failed"}
              </h1>
              <p className="text-muted font-sans mb-8">
                {timedOut
                  ? "This is taking longer than expected. If money was deducted, it will be refunded automatically if the payment didn't complete."
                  : "Your payment didn't go through. No charge was made."}
              </p>
              <Button href="/checkout" variant="outline" className="mb-8">
                Try again
              </Button>
            </>
          )}
        </div>

        <HairlineRule className="mb-2" />
        <ul className="divide-y divide-hairline text-left">
          {order.items.map((item, i) => (
            <LineItemRow
              key={i}
              name={item.productName}
              subtitle={`Qty ${item.quantity}`}
              right={<span className="text-text">{formatPrice(item.lineTotalInPaise, order.currency)}</span>}
            />
          ))}
        </ul>
        <HairlineRule variant="gold" />
        <div className="mt-4 flex justify-between items-baseline">
          <span className="font-serif text-lg">Total</span>
          <span className="font-serif text-lg">{formatPrice(order.subtotalInPaise, order.currency)}</span>
        </div>

        <div className="flex justify-center gap-8 mt-10">
          <Button href="/" variant="ghost">
            Home
          </Button>
          <Button href="/products" variant="ghost">
            Continue shopping
          </Button>
        </div>
      </Container>
    </main>
  );
}
