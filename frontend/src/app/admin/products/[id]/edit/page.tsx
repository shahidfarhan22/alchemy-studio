"use client";

import { use, useEffect, useState } from "react";
import { ProductForm } from "../../ProductForm";
import { getAdminProducts, updateProduct } from "@/lib/catalog-api";
import type { ProductAdminDto } from "@/lib/catalog-types";
import type { ProductFormInput } from "@/lib/catalog-api";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductAdminDto | null | undefined>(undefined);

  useEffect(() => {
    // No single-product admin endpoint yet -- fine at this catalog size,
    // fetch the list and find it. Revisit if the catalog grows large.
    getAdminProducts().then((all) => setProduct(all.find((p) => p.id === id) ?? null));
  }, [id]);

  if (product === undefined) {
    return <main className="flex-1 p-6 text-gray-500">Loading...</main>;
  }
  if (product === null) {
    return <main className="flex-1 p-6 text-red-600">Product not found.</main>;
  }

  function handleSubmit(input: ProductFormInput) {
    return updateProduct(id, { ...input, rowVersion: product!.rowVersion });
  }

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">Edit product</h1>
      <ProductForm initial={product} submitLabel="Save changes" onSubmit={handleSubmit} />
    </main>
  );
}
