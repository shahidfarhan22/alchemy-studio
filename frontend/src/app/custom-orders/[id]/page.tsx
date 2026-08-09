"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getMyCustomOrder,
  acceptCustomOrderQuote,
  declineCustomOrderQuote,
  cancelCustomOrder,
} from "@/lib/custom-orders-api";
import type { CustomOrderRequestDto } from "@/lib/custom-orders-api";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { Button } from "@/components/ui/Button";
import { AddressPicker } from "@/components/commerce/AddressPicker";

export default function CustomOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=/custom-orders/${id}`);
    }
  }, [authLoading, user, router, id]);

  const [request, setRequest] = useState<CustomOrderRequestDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  function load() {
    getMyCustomOrder(id)
      .then(setRequest)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this request."));
  }

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  if (authLoading || !user || (!request && !error)) {
    return (
      <main className="flex-1 py-16">
        <Container size="sm">
          <p className="text-muted font-sans">Loading…</p>
        </Container>
      </main>
    );
  }

  if (error && !request) {
    return (
      <main className="flex-1 py-16">
        <Container size="sm">
          <ErrorBanner>{error}</ErrorBanner>
        </Container>
      </main>
    );
  }

  const r = request!;

  async function handleAccept() {
    if (!selectedAddressId) return;
    setError(null);
    setIsPaying(true);
    try {
      const order = await acceptCustomOrderQuote(id, selectedAddressId);
      await openRazorpayCheckout({
        key: order.razorpayKeyId,
        amount: order.amountInPaise,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Alchemy Studio",
        prefill: { name: user!.displayName, email: user!.email },
        handler: () => {
          // Same reasoning as checkout: this callback is UX-only, the order
          // page polls the backend, which only changes status once
          // Razorpay's webhook confirms payment.
          router.push(`/orders/${order.orderId}`);
        },
        modal: { ondismiss: () => setIsPaying(false) },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start payment. Please try again.");
      setIsPaying(false);
    }
  }

  async function handleDecline() {
    setError(null);
    setIsDeclining(true);
    try {
      const updated = await declineCustomOrderQuote(id);
      setRequest(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't decline this quote.");
    } finally {
      setIsDeclining(false);
    }
  }

  async function handleCancel() {
    setError(null);
    setIsCancelling(true);
    try {
      const updated = await cancelCustomOrder(id);
      setRequest(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cancel this request.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <main className="flex-1 py-16">
      <Container size="sm">
        <EyebrowLabel wide className="block mb-3">
          {r.status}
        </EyebrowLabel>
        <PageHeading className="mb-8">{r.description || "Custom miniature request"}</PageHeading>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <dl className="font-sans text-sm space-y-3 mt-6">
          {r.imageUrl && (
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.imageUrl} alt="Reference" className="max-h-64 border border-hairline" />
            </div>
          )}
          {(r.budgetMinInPaise !== null || r.budgetMaxInPaise !== null) && (
            <div className="flex justify-between">
              <dt className="text-muted">Budget</dt>
              <dd className="text-text">
                {r.budgetMinInPaise !== null ? formatPrice(r.budgetMinInPaise, "INR") : "Any"}
                {" – "}
                {r.budgetMaxInPaise !== null ? formatPrice(r.budgetMaxInPaise, "INR") : "Any"}
              </dd>
            </div>
          )}
          {r.desiredScale && (
            <div className="flex justify-between">
              <dt className="text-muted">Desired scale</dt>
              <dd className="text-text">{r.desiredScale}</dd>
            </div>
          )}
        </dl>

        {r.status === "Requested" && (
          <div className="mt-10">
            <p className="text-muted font-sans mb-4">We&apos;ll follow up here once we&apos;ve reviewed your request.</p>
            <Button variant="ghost" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? "Cancelling…" : "Cancel request"}
            </Button>
          </div>
        )}

        {r.status === "Quoted" && (
          <div className="mt-10">
            <HairlineRule variant="gold" className="mb-6" />
            <EyebrowLabel as="h2" className="block mb-3">
              Your quote
            </EyebrowLabel>
            <p className="font-serif text-3xl mb-2">{formatPrice(r.quotedPriceInPaise!, "INR")}</p>
            {r.quoteNote && <p className="text-muted font-sans mb-2">{r.quoteNote}</p>}
            {r.quoteExpiresAt && (
              <p className="text-xs text-muted font-sans mb-8">
                Valid until {new Date(r.quoteExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}

            <EyebrowLabel as="h2" className="block mb-4">
              Shipping address
            </EyebrowLabel>
            <AddressPicker selectedAddressId={selectedAddressId} onChange={setSelectedAddressId} />

            <div className="flex items-center gap-6 mt-8">
              <Button onClick={handleAccept} disabled={isPaying || !selectedAddressId}>
                {isPaying ? "Opening payment…" : "Accept & pay"}
              </Button>
              <Button variant="ghost" onClick={handleDecline} disabled={isDeclining || isPaying}>
                {isDeclining ? "Declining…" : "Decline"}
              </Button>
            </div>
          </div>
        )}

        {r.status === "Expired" && (
          <div className="mt-10">
            <p className="text-muted font-sans mb-4">This quote has expired.</p>
            <Button href="/custom-orders/new" variant="outline">
              Submit a new request
            </Button>
          </div>
        )}

        {r.status === "Accepted" && r.orderId && (
          <div className="mt-10">
            <p className="text-muted font-sans mb-4">Accepted — your order is being processed.</p>
            <Button href={`/orders/${r.orderId}`} variant="outline">
              View order status
            </Button>
          </div>
        )}

        {(r.status === "Declined" || r.status === "Cancelled") && (
          <div className="mt-10">
            <p className="text-muted font-sans mb-4">
              {r.status === "Declined" ? "You declined this quote." : "This request was cancelled."}
            </p>
            <Button href="/custom-orders/new" variant="outline">
              Submit a new request
            </Button>
          </div>
        )}
      </Container>
    </main>
  );
}
