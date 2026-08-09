"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getAddresses, createAddress } from "@/lib/address-api";
import type { AddressDto } from "@/lib/address-api";
import { ApiError } from "@/lib/api-client";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldError } from "@/components/ui/FieldError";

// Shared by checkout and custom-order quote acceptance -- both need the
// exact same "pick a saved address, or add a new one" flow.
type AddressPickerProps = {
  selectedAddressId: string | null;
  onChange: (id: string) => void;
};

export function AddressPicker({ selectedAddressId, onChange }: AddressPickerProps) {
  const [addresses, setAddresses] = useState<AddressDto[] | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  useEffect(() => {
    getAddresses().then((list) => {
      setAddresses(list);
      const preferred = list.find((a) => a.isDefault) ?? list[0];
      if (preferred) onChange(preferred.id);
      if (list.length === 0) setShowNewAddressForm(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (addresses === null) {
    return <p className="text-muted font-sans text-sm">Loading…</p>;
  }

  return (
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
                onChange={() => onChange(a.id)}
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
            onChange(created.id);
            setShowNewAddressForm(false);
          }}
          onCancel={addresses.length > 0 ? () => setShowNewAddressForm(false) : undefined}
        />
      )}
    </>
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
