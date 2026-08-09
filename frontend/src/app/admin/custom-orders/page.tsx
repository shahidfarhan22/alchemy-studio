"use client";

import { useEffect, useState } from "react";
import { getAllCustomOrdersForAdmin, quoteCustomOrder } from "@/lib/custom-orders-api";
import type { CustomOrderAdminDto } from "@/lib/custom-orders-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";

export default function AdminCustomOrdersPage() {
  const [requests, setRequests] = useState<CustomOrderAdminDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotingId, setQuotingId] = useState<string | null>(null);

  function load() {
    getAllCustomOrdersForAdmin()
      .then((data) => {
        setRequests(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load requests."));
  }

  useEffect(load, []);

  return (
    <main className="flex-1 py-16">
      <Container size="xl">
        <PageHeading eyebrow="Admin" className="mb-10">
          Custom Orders
        </PageHeading>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {requests === null ? (
          <p className="text-muted font-sans">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-muted font-sans">No custom requests yet.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {requests.map((r) => (
              <li key={r.id} className="py-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-eyebrow text-gold mb-1.5">{r.status}</p>
                    <p className="font-serif text-lg text-text">{r.description || "Custom miniature request"}</p>
                    <p className="text-sm text-muted font-sans mt-1">
                      {r.userDisplayName} · {r.userEmail}
                    </p>
                    <p className="text-xs text-muted font-sans mt-1">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {r.desiredScale ? ` · ${r.desiredScale}` : ""}
                      {r.budgetMinInPaise !== null || r.budgetMaxInPaise !== null
                        ? ` · Budget: ${r.budgetMinInPaise !== null ? formatPrice(r.budgetMinInPaise, "INR") : "any"} – ${r.budgetMaxInPaise !== null ? formatPrice(r.budgetMaxInPaise, "INR") : "any"}`
                        : ""}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {r.quotedPriceInPaise !== null && (
                      <p className="font-serif text-lg text-text">{formatPrice(r.quotedPriceInPaise, "INR")}</p>
                    )}
                    {r.status === "Requested" && quotingId !== r.id && (
                      <Button variant="ghost" onClick={() => setQuotingId(r.id)}>
                        Send quote
                      </Button>
                    )}
                  </div>
                </div>

                {quotingId === r.id && (
                  <QuoteForm
                    requestId={r.id}
                    onQuoted={() => {
                      setQuotingId(null);
                      load();
                    }}
                    onCancel={() => setQuotingId(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}

function QuoteForm({ requestId, onQuoted, onCancel }: { requestId: string; onQuoted: () => void; onCancel: () => void }) {
  const [priceRupees, setPriceRupees] = useState("");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const priceInPaise = Math.round(parseFloat(priceRupees || "0") * 100);
      await quoteCustomOrder(requestId, priceInPaise, note.trim() || null);
      onQuoted();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(Object.fromEntries(err.details.map((d) => [d.field, d.issue])));
      }
      setFormError(err instanceof ApiError ? err.message : "Couldn't send quote.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border border-hairline p-5 space-y-4 max-w-sm">
      {formError && <ErrorBanner>{formError}</ErrorBanner>}
      <div>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Price, ₹"
          value={priceRupees}
          onChange={(e) => setPriceRupees(e.target.value)}
          invalid={!!fieldErrors.priceInPaise}
        />
        <FieldError>{fieldErrors.priceInPaise}</FieldError>
      </div>
      <Input placeholder="Note (optional) — e.g. includes base, excludes paint" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex items-center gap-6">
        <Button type="submit" disabled={isSubmitting} variant="outline">
          {isSubmitting ? "Sending…" : "Send quote"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
