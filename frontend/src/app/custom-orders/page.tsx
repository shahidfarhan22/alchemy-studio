"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getMyCustomOrders } from "@/lib/custom-orders-api";
import type { CustomOrderRequestDto, CustomOrderStatus } from "@/lib/custom-orders-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { HairlineRule } from "@/components/ui/HairlineRule";

const STATUS_TONE: Record<CustomOrderStatus, string> = {
  Requested: "text-muted",
  Quoted: "text-gold",
  Accepted: "text-success",
  Declined: "text-muted",
  Cancelled: "text-muted",
  Expired: "text-warning",
};

export default function MyCustomOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/custom-orders");
    }
  }, [authLoading, user, router]);

  const [requests, setRequests] = useState<CustomOrderRequestDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyCustomOrders()
      .then(setRequests)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your requests."));
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

  return (
    <main className="flex-1 py-16">
      <Container>
        <div className="flex items-center justify-between mb-10">
          <PageHeading eyebrow="Commissions">Your requests</PageHeading>
          <Button href="/custom-orders/new" variant="outline">
            New request
          </Button>
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {requests === null ? (
          <p className="text-muted font-sans">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted font-sans mb-6">You haven&apos;t requested a custom piece yet.</p>
            <Button href="/custom-orders/new" variant="outline">
              Commission a piece
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {requests.map((r) => (
              <li key={r.id} className="py-5">
                <Link href={`/custom-orders/${r.id}`} className="group flex items-center justify-between gap-6">
                  <div className="min-w-0">
                    <p className="font-serif text-lg text-text group-hover:text-gold transition-colors truncate">
                      {r.description || "Custom miniature request"}
                    </p>
                    <p className="text-xs text-muted font-sans mt-1">
                      Submitted {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs uppercase tracking-eyebrow ${STATUS_TONE[r.status]}`}>{r.status}</p>
                    {r.quotedPriceInPaise !== null && (
                      <p className="text-sm text-text mt-1 font-sans">{formatPrice(r.quotedPriceInPaise, "INR")}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <HairlineRule className="mt-2" />
      </Container>
    </main>
  );
}
