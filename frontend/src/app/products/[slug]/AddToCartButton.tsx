"use client";

import { useState } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart-api";
import { ApiError } from "@/lib/api-client";

export function AddToCartButton({ productId, inStock }: { productId: string; inStock: boolean }) {
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setStatus("adding");
    setError(null);
    try {
      await addToCart(productId, 1);
      setStatus("added");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add to cart.");
      setStatus("idle");
    }
  }

  if (!inStock) {
    return <button disabled className="rounded bg-gray-300 text-white px-4 py-2 mt-4">Out of stock</button>;
  }

  if (status === "added") {
    return (
      <div className="mt-4 flex items-center gap-3">
        <span className="text-green-700 text-sm">Added to cart.</span>
        <Link href="/cart" className="underline text-sm">View cart</Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleAdd}
        disabled={status === "adding"}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {status === "adding" ? "Adding..." : "Add to cart"}
      </button>
      {error && <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
