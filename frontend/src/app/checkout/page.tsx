"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getCart } from "@/lib/cart-api";
import type { CartDto } from "@/lib/cart-api";
import { getAddresses, createAddress } from "@/lib/address-api";
import type { AddressDto } from "@/lib/address-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";

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
    return <main className="flex-1 p-6 text-gray-500">Loading...</main>;
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full p-6">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-4">{error}</p>}

      <section className="mb-8">
        <h2 className="font-medium mb-3">Order summary</h2>
        {cart === null ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <>
            <ul className="divide-y text-sm">
              {cart.items.map((item) => (
                <li key={item.productId} className="py-2 flex justify-between">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatPrice(item.lineTotalInPaise, item.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-medium pt-2 border-t mt-2">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotalInPaise, cart.currency)}</span>
            </div>
          </>
        )}
      </section>

      <section className="mb-8">
        <h2 className="font-medium mb-3">Shipping address</h2>
        {addresses === null ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <>
            {addresses.length > 0 && (
              <div className="space-y-2 mb-3">
                {addresses.map((a) => (
                  <label key={a.id} className="flex items-start gap-2 text-sm border rounded p-3 cursor-pointer">
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === a.id}
                      onChange={() => setSelectedAddressId(a.id)}
                      className="mt-1"
                    />
                    <span>
                      <strong>{a.fullName}</strong> — {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode} — {a.phone}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {!showNewAddressForm ? (
              <button onClick={() => setShowNewAddressForm(true)} className="text-sm underline">
                + Add a new address
              </button>
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

      <button
        disabled
        title="Payment isn't built yet -- coming in the next milestone"
        className="w-full rounded bg-gray-300 text-white py-3 cursor-not-allowed"
      >
        Continue to payment (coming soon)
      </button>
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
    <form onSubmit={handleSubmit} className="space-y-3 border rounded p-3">
      {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
      <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
      {fieldErrors.fullName && <p className="text-sm text-red-600">{fieldErrors.fullName}</p>}

      <input placeholder="Address line 1" value={line1} onChange={(e) => setLine1(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
      {fieldErrors.line1 && <p className="text-sm text-red-600">{fieldErrors.line1}</p>}

      <input placeholder="Address line 2 (optional)" value={line2} onChange={(e) => setLine2(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />

      <div className="grid grid-cols-2 gap-2">
        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      {(fieldErrors.city || fieldErrors.state) && (
        <p className="text-sm text-red-600">{fieldErrors.city || fieldErrors.state}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      {(fieldErrors.postalCode || fieldErrors.phone) && (
        <p className="text-sm text-red-600">{fieldErrors.postalCode || fieldErrors.phone}</p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-50">
          {isSubmitting ? "Saving..." : "Save address"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm underline">Cancel</button>
        )}
      </div>
    </form>
  );
}
