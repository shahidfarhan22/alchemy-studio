"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getOrder } from "@/lib/orders-api";
import type { OrderDetailDto } from "@/lib/orders-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";

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
    return <main className="flex-1 p-6 text-center text-red-600">{error}</main>;
  }
  if (!order) {
    return <main className="flex-1 p-6 text-center text-gray-500">Loading...</main>;
  }

  const timedOut = order.status === "PendingPayment" && hasTimedOut;

  return (
    <main className="flex-1 max-w-lg mx-auto w-full p-6 text-center">
      {order.status === "Paid" && (
        <>
          <h1 className="text-2xl font-semibold text-green-700 mb-2">Payment successful</h1>
          <p className="text-gray-600 mb-6">Thanks for your order!</p>
        </>
      )}

      {order.status === "PendingPayment" && !timedOut && (
        <>
          <h1 className="text-xl font-semibold mb-2">Confirming your payment...</h1>
          <p className="text-gray-500 mb-6">This usually takes a few seconds.</p>
        </>
      )}

      {(order.status === "PaymentFailed" || timedOut) && (
        <>
          <h1 className="text-xl font-semibold text-red-600 mb-2">
            {timedOut ? "Still waiting on confirmation" : "Payment failed"}
          </h1>
          <p className="text-gray-600 mb-6">
            {timedOut
              ? "This is taking longer than expected. If money was deducted, it will be refunded automatically if the payment didn't complete."
              : "Your payment didn't go through. No charge was made."}
          </p>
          <Link href="/checkout" className="underline">Try again</Link>
        </>
      )}

      <div className="text-left border-t pt-4 mt-4">
        <ul className="divide-y text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="py-2 flex justify-between">
              <span>{item.productName} × {item.quantity}</span>
              <span>{formatPrice(item.lineTotalInPaise, order.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-medium pt-2 border-t mt-2">
          <span>Total</span>
          <span>{formatPrice(order.subtotalInPaise, order.currency)}</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-6 text-sm">
        <Link href="/" className="underline">Home</Link>
        <Link href="/products" className="underline">Continue shopping</Link>
      </div>
    </main>
  );
}
