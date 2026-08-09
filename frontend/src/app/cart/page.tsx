"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, updateCartItem, removeCartItem } from "@/lib/cart-api";
import type { CartDto } from "@/lib/cart-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";

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
    return <main className="flex-1 p-6 text-gray-500">Loading...</main>;
  }

  const availableItems = cart?.items.filter((i) => i.isAvailable) ?? [];
  const canCheckout = availableItems.length > 0 && availableItems.every((i) => i.inStock);

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full p-6">
      <h1 className="text-2xl font-semibold mb-6">Your cart</h1>

      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-4">{error}</p>}

      {cart && cart.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link href="/products" className="underline">Browse products</Link>
        </div>
      ) : cart ? (
        <>
          <ul className="divide-y">
            {cart.items.map((item) => (
              <li key={item.productId} className="py-4 flex gap-4 items-center">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : null}
                </div>

                <div className="flex-1">
                  <Link href={`/products/${item.productSlug}`} className="font-medium hover:underline">
                    {item.productName}
                  </Link>
                  {!item.isAvailable ? (
                    <p className="text-sm text-red-600">No longer available</p>
                  ) : !item.inStock ? (
                    <p className="text-sm text-red-600">Out of stock</p>
                  ) : (
                    <p className="text-sm text-gray-600">{formatPrice(item.priceInPaise, item.currency)} each</p>
                  )}
                </div>

                {item.isAvailable ? (
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    disabled={pendingProductId === item.productId}
                    onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value, 10) || 0)}
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <button
                    onClick={() => handleQuantityChange(item.productId, 0)}
                    disabled={pendingProductId === item.productId}
                    className="text-sm underline text-red-600"
                  >
                    Remove
                  </button>
                )}

                <p className="w-24 text-right text-sm">{formatPrice(item.lineTotalInPaise, item.currency)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <span className="font-medium">Subtotal</span>
            <span className="font-medium">{formatPrice(cart.subtotalInPaise, cart.currency)}</span>
          </div>

          {!canCheckout && cart.items.length > 0 && (
            <p className="text-sm text-amber-700 mt-2">
              Remove or update unavailable/out-of-stock items before checking out.
            </p>
          )}

          <Link
            href="/checkout"
            aria-disabled={!canCheckout}
            className={`mt-4 block text-center rounded px-4 py-2 text-white ${canCheckout ? "bg-black" : "bg-gray-300 pointer-events-none"}`}
          >
            Proceed to checkout
          </Link>
        </>
      ) : null}
    </main>
  );
}
