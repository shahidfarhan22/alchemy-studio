"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getCart } from "@/lib/cart-api";
import type { CartDto } from "@/lib/cart-api";
import { getAddresses, createAddress } from "@/lib/address-api";
import type { AddressDto } from "@/lib/address-api";
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
import { Input } from "@/components/ui/Input";
import { FieldError } from "@/components/ui/FieldError";
import { LineItemRow } from "@/components/catalog/LineItemRow";

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
  const [addresses, setAddresses] = useState<AddressDto[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCart().then(setCart).catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load cart."));
    getAddresses().then((list) => {
      setAddresses(list);
      const preferred = list.find((a) => a.isDefault) ?? list[0];
      if (preferred) setSelectedAddressId(preferred.id);
      if (list.length === 0) setShowNewAddressForm(true);
    });
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
          {addresses === null ? (
            <p className="text-muted font-sans text-sm">Loading…</p>
          ) : (
            <>
              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-start gap-3 text-sm font-sans border px-4 py-3 cursor-pointer transition-colors ${
                        selectedAddressId === a.id ? "border-gold" : "border-hairline"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="mt-1 accent-[#c9a227]"
                      />
                      <span className="text-muted">
                        <strong className="text-text font-medium">{a.fullName}</strong> — {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode} — {a.phone}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {!showNewAddressForm ? (
                <Button variant="ghost" onClick={() => setShowNewAddressForm(true)}>
                  + Add a new address
                </Button>
              ) : (
                <NewAddressForm
                  onCreated={(created) => {
                    setAddresses((prev) => [...(prev ?? []), created]);
                    setSelectedAddressId(created.id);
                    setShowNewAddressForm(false);
                  }}
                  onCancel={addresses.length > 0 ? () => setShowNewAddressForm(false) : undefined}
                />
              )}
            </>
          )}
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

function NewAddressForm({ onCreated, onCancel }: { onCreated: (a: AddressDto) => void; onCancel?: () => void }) {
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const created = await createAddress({
        fullName, line1, line2: line2.trim() || null, city, state, postalCode, phone, isDefault: true,
      });
      onCreated(created);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(Object.fromEntries(err.details.map((d) => [d.field, d.issue])));
      }
      setFormError(err instanceof ApiError ? err.message : "Couldn't save address.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-hairline p-5">
      {formError && <ErrorBanner>{formError}</ErrorBanner>}

      <div>
        <Input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          invalid={!!fieldErrors.fullName}
        />
        <FieldError>{fieldErrors.fullName}</FieldError>
      </div>

      <div>
        <Input
          placeholder="Address line 1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          invalid={!!fieldErrors.line1}
        />
        <FieldError>{fieldErrors.line1}</FieldError>
      </div>

      <Input placeholder="Address line 2 (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} invalid={!!fieldErrors.city} />
        <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} invalid={!!fieldErrors.state} />
      </div>
      <FieldError>{fieldErrors.city || fieldErrors.state}</FieldError>

      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Postal code"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          invalid={!!fieldErrors.postalCode}
        />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} invalid={!!fieldErrors.phone} />
      </div>
      <FieldError>{fieldErrors.postalCode || fieldErrors.phone}</FieldError>

      <div className="flex items-center gap-6 pt-1">
        <Button type="submit" disabled={isSubmitting} variant="outline">
          {isSubmitting ? "Saving…" : "Save address"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
