"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart-api";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

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
    return (
      <div className="mt-8">
        <Button disabled>Out of stock</Button>
      </div>
    );
  }

  if (status === "added") {
    return (
      <div className="mt-8 flex items-center gap-4">
        <span className="text-xs uppercase tracking-eyebrow text-success">Added to cart</span>
        <Button href="/cart" variant="ghost">
          View cart →
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Button onClick={handleAdd} disabled={status === "adding"} variant="outline">
        {status === "adding" ? "Adding…" : "Add to cart"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
