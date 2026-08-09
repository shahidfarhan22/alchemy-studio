"use client";

import { useEffect, useState } from "react";
import { getAllOrdersForAdmin } from "@/lib/admin-orders-api";
import type { AdminOrderSummaryDto } from "@/lib/admin-orders-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Button } from "@/components/ui/Button";

const STATUS_TONE: Record<string, string> = {
  PendingPayment: "text-muted",
  Paid: "text-success",
  PaymentFailed: "text-danger",
  Cancelled: "text-muted",
  Refunded: "text-warning",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummaryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllOrdersForAdmin()
      .then((data) => {
        setOrders(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load orders."));
  }, []);

  return (
    <main className="flex-1 py-16">
      <Container size="xl">
        <div className="flex items-center justify-between mb-10">
          <PageHeading eyebrow="Admin">Orders</PageHeading>
          <Button href="/admin/dashboard" variant="ghost">
            View dashboard →
          </Button>
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {orders === null ? (
          <p className="text-muted font-sans">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-muted font-sans">No orders yet.</p>
        ) : (
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="text-left border-b border-hairline text-xs uppercase tracking-eyebrow text-muted">
                <th className="py-3 font-normal">Customer</th>
                <th className="py-3 font-normal">Total</th>
                <th className="py-3 font-normal">Payment</th>
                <th className="py-3 font-normal">Fulfillment</th>
                <th className="py-3 font-normal">Placed</th>
                <th className="py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-hairline">
                  <td className="py-3 font-serif text-text">{o.userEmail}</td>
                  <td className="py-3">{formatPrice(o.subtotalInPaise, o.currency)}</td>
                  <td className="py-3">
                    <span className={`text-xs uppercase tracking-eyebrow ${STATUS_TONE[o.status] ?? "text-muted"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted">{o.fulfillmentStatus ?? "—"}</td>
                  <td className="py-3 text-muted">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 text-right">
                    <Button href={`/admin/orders/${o.id}`} variant="ghost">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Container>
    </main>
  );
}
