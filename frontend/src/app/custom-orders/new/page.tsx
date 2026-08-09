"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createCustomOrder } from "@/lib/custom-orders-api";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FieldError } from "@/components/ui/FieldError";
import { Button } from "@/components/ui/Button";

// Every field here is deliberately optional (docs/decisions.md ADR-016) --
// someone might only have a reference image, or only a budget in mind.
export default function NewCustomOrderPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/custom-orders/new");
    }
  }, [authLoading, user, router]);

  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [desiredScale, setDesiredScale] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading || !user) {
    return (
      <main className="flex-1 py-16">
        <Container>
          <p className="text-muted font-sans">Loading…</p>
        </Container>
      </main>
    );
  }

  function toRupeesInPaise(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return Math.round(parseFloat(trimmed) * 100);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const created = await createCustomOrder({
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        budgetMinInPaise: toRupeesInPaise(budgetMin),
        budgetMaxInPaise: toRupeesInPaise(budgetMax),
        desiredScale: desiredScale.trim() || null,
      });
      router.push(`/custom-orders/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(Object.fromEntries(err.details.map((d) => [d.field, d.issue])));
      }
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 py-16">
      <Container size="sm">
        <PageHeading eyebrow="Commission a piece" className="mb-3">
          Request a custom miniature
        </PageHeading>
        <p className="text-muted font-sans mb-10 leading-relaxed">
          Tell us as much or as little as you&apos;d like — every field here is optional. We&apos;ll follow up with a quote.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {formError && <ErrorBanner>{formError}</ErrorBanner>}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              placeholder="What would you like made? Character, creature, scene..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Reference image URL (optional)</Label>
            <Input
              id="imageUrl"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-xs text-muted font-sans mt-1.5">
              Paste a link to a reference photo or sketch, if you have one.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budgetMin">Budget min, ₹ (optional)</Label>
              <Input
                id="budgetMin"
                type="number"
                min="0"
                step="0.01"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                invalid={!!fieldErrors.budgetMinInPaise}
              />
            </div>
            <div>
              <Label htmlFor="budgetMax">Budget max, ₹ (optional)</Label>
              <Input
                id="budgetMax"
                type="number"
                min="0"
                step="0.01"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                invalid={!!fieldErrors.budgetMaxInPaise}
              />
            </div>
          </div>
          <FieldError>{fieldErrors.budgetMinInPaise || fieldErrors.budgetMaxInPaise}</FieldError>

          <div>
            <Label htmlFor="desiredScale">Desired scale (optional)</Label>
            <Input
              id="desiredScale"
              placeholder="e.g. 32mm, 75mm, not sure"
              value={desiredScale}
              onChange={(e) => setDesiredScale(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      </Container>
    </main>
  );
}
