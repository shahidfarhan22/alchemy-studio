"use client";

import { useEffect, useState } from "react";
import { getCart, updateCartItem, removeCartItem } from "@/lib/cart-api";
import type { CartDto } from "@/lib/cart-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LineItemRow } from "@/components/catalog/LineItemRow";

export default function CartPage() {
  const [cart, setCart] = useState<CartDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  function load() {
    getCart()
      .then((data) => {
        setCart(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load your cart."));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleQuantityChange(productId: string, quantity: number) {
    setPendingProductId(productId);
    setError(null);
    try {
      const updated = quantity < 1 ? await removeCartItem(productId) : await updateCartItem(productId, quantity);
      setCart(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update your cart.");
    } finally {
      setPendingProductId(null);
    }
  }

  if (cart === null && !error) {
    return (
      <main className="flex-1 py-16">
        <Container>
          <p className="text-muted font-sans">Loading…</p>
        </Container>
      </main>
    );
  }

  const availableItems = cart?.items.filter((i) => i.isAvailable) ?? [];
  const canCheckout = availableItems.length > 0 && availableItems.every((i) => i.inStock);

  return (
    <main className="flex-1 py-16">
      <Container>
        <PageHeading className="mb-8">Your cart</PageHeading>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {cart && cart.items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted font-sans mb-6">Your cart is empty.</p>
            <Button href="/products" variant="outline">
              Browse the collection
            </Button>
          </div>
        ) : cart ? (
          <>
            <ul className="divide-y divide-hairline">
              {cart.items.map((item) => (
                <LineItemRow
                  key={item.productId}
                  name={item.productName}
                  href={`/products/${item.productSlug}`}
                  imageUrl={item.imageUrl}
                  subtitle={
                    !item.isAvailable ? (
                      <span className="text-danger">No longer available</span>
                    ) : !item.inStock ? (
                      <span className="text-danger">Out of stock</span>
                    ) : (
                      `${formatPrice(item.priceInPaise, item.currency)} each`
                    )
                  }
                  right={
                    <div className="flex items-center gap-4">
                      {item.isAvailable ? (
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity}
                          disabled={pendingProductId === item.productId}
                          onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value, 10) || 0)}
                          className="w-16 py-1.5 text-center"
                          aria-label={`Quantity for ${item.productName}`}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.productId, 0)}
                          disabled={pendingProductId === item.productId}
                          className="text-xs uppercase tracking-eyebrow text-danger hover:text-text transition-colors"
                        >
                          Remove
                        </button>
                      )}
                      <span className="w-24 text-right text-text">{formatPrice(item.lineTotalInPaise, item.currency)}</span>
                    </div>
                  }
                />
              ))}
            </ul>

            <HairlineRule variant="gold" className="mt-6" />
            <div className="mt-4 flex items-center justify-between">
              <span className="font-serif text-lg">Subtotal</span>
              <span className="font-serif text-lg">{formatPrice(cart.subtotalInPaise, cart.currency)}</span>
            </div>

            {!canCheckout && cart.items.length > 0 && (
              <p className="text-sm text-warning mt-3 font-sans">
                Remove or update unavailable/out-of-stock items before checking out.
              </p>
            )}

            <div className="mt-8">
              <Button href="/checkout" disabled={!canCheckout} fullWidth>
                Proceed to checkout
              </Button>
            </div>
          </>
        ) : null}
      </Container>
    </main>
  );
}
