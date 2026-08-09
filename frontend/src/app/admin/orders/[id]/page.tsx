"use client";

import { use, useEffect, useState } from "react";
import { getOrderForAdmin, updateFulfillment, refundOrder } from "@/lib/admin-orders-api";
import type { AdminOrderDetailDto, FulfillmentStatus } from "@/lib/admin-orders-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LineItemRow } from "@/components/catalog/LineItemRow";

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<AdminOrderDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  function load() {
    getOrderForAdmin(id)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this order."));
  }

  useEffect(load, [id]);

  if (error && !order) {
    return (
      <main className="flex-1 py-16">
        <Container size="lg">
          <ErrorBanner>{error}</ErrorBanner>
        </Container>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="flex-1 py-16">
        <Container size="lg">
          <p className="text-muted font-sans">Loading…</p>
        </Container>
      </main>
    );
  }

  async function handleAdvanceFulfillment(next: FulfillmentStatus) {
    setError(null);
    setIsUpdating(true);
    try {
      const updated = await updateFulfillment(id, next, trackingNumber.trim() || null, carrier.trim() || null);
      setOrder(updated);
      setTrackingNumber("");
      setCarrier("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update fulfillment.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRefund() {
    if (!confirm(`Refund ${formatPrice(order!.subtotalInPaise, order!.currency)} for this order? This calls Razorpay's real refund API.`)) return;
    setError(null);
    setIsRefunding(true);
    try {
      const updated = await refundOrder(id);
      setOrder(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't initiate refund.");
    } finally {
      setIsRefunding(false);
    }
  }

  const canRefund = order.status === "Paid" && !order.razorpayRefundId;
  const refundInitiated = order.status === "Paid" && !!order.razorpayRefundId;

  return (
    <main className="flex-1 py-16">
      <Container size="lg">
        <EyebrowLabel wide className="block mb-3">
          {order.status}
        </EyebrowLabel>
        <PageHeading className="mb-2">{order.userEmail}</PageHeading>
        <p className="text-xs text-muted font-sans mb-8">
          Placed {new Date(order.createdAt).toLocaleString("en-IN")}
        </p>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <div className="grid sm:grid-cols-2 gap-12 mt-8">
          <section>
            <EyebrowLabel as="h2" className="block mb-4">
              Items
            </EyebrowLabel>
            <ul className="divide-y divide-hairline">
              {order.items.map((item, i) => (
                <LineItemRow
                  key={i}
                  name={item.productName}
                  subtitle={`Qty ${item.quantity}`}
                  right={<span className="text-text">{formatPrice(item.lineTotalInPaise, order.currency)}</span>}
                />
              ))}
            </ul>
            <HairlineRule variant="gold" className="mt-4" />
            <div className="mt-4 flex justify-between items-baseline">
              <span className="font-serif text-lg">Total</span>
              <span className="font-serif text-lg">{formatPrice(order.subtotalInPaise, order.currency)}</span>
            </div>

            <EyebrowLabel as="h2" className="block mt-10 mb-4">
              Shipping address
            </EyebrowLabel>
            <p className="text-sm text-muted font-sans leading-relaxed">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.phone}
            </p>

            <EyebrowLabel as="h2" className="block mt-10 mb-4">
              Payment
            </EyebrowLabel>
            <dl className="text-sm font-sans space-y-1.5 text-muted">
              {order.razorpayOrderId && <div>Order: {order.razorpayOrderId}</div>}
              {order.razorpayPaymentId && <div>Payment: {order.razorpayPaymentId}</div>}
              {order.razorpayRefundId && <div>Refund: {order.razorpayRefundId}</div>}
            </dl>
          </section>

          <section>
            <EyebrowLabel as="h2" className="block mb-4">
              Fulfillment
            </EyebrowLabel>

            {order.status !== "Paid" ? (
              <p className="text-muted font-sans text-sm">Nothing to fulfill — this order was never paid.</p>
            ) : (
              <>
                <p className="text-sm font-sans mb-4">
                  Status: <span className="text-text">{order.fulfillmentStatus ?? "Processing"}</span>
                </p>
                {order.trackingNumber && (
                  <p className="text-sm text-muted font-sans mb-4">
                    {order.carrier ?? "Carrier"}: {order.trackingNumber}
                  </p>
                )}

                {(order.fulfillmentStatus ?? "Processing") === "Processing" && (
                  <div className="space-y-3">
                    <Input placeholder="Tracking number (optional)" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                    <Input placeholder="Carrier (optional)" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
                    <Button variant="outline" disabled={isUpdating} onClick={() => handleAdvanceFulfillment("Shipped")}>
                      {isUpdating ? "Updating…" : "Mark shipped"}
                    </Button>
                  </div>
                )}
                {order.fulfillmentStatus === "Shipped" && (
                  <Button variant="outline" disabled={isUpdating} onClick={() => handleAdvanceFulfillment("Delivered")}>
                    {isUpdating ? "Updating…" : "Mark delivered"}
                  </Button>
                )}
                {order.fulfillmentStatus === "Delivered" && <p className="text-sm text-success font-sans">Delivered.</p>}
              </>
            )}

            <EyebrowLabel as="h2" className="block mt-10 mb-4">
              Refund
            </EyebrowLabel>
            {order.status === "Refunded" ? (
              <p className="text-sm text-warning font-sans">This order has been refunded.</p>
            ) : refundInitiated ? (
              <p className="text-sm text-muted font-sans">Refund initiated — awaiting confirmation from Razorpay.</p>
            ) : canRefund ? (
              <Button variant="outline" disabled={isRefunding} onClick={handleRefund}>
                {isRefunding ? "Processing…" : "Refund this order"}
              </Button>
            ) : (
              <p className="text-sm text-muted font-sans">Not eligible for a refund.</p>
            )}
          </section>
        </div>
      </Container>
    </main>
  );
}
