"use client";

import { use, useEffect, useState } from "react";
import { ProductForm } from "../../ProductForm";
import { getAdminProducts, updateProduct } from "@/lib/catalog-api";
import type { ProductAdminDto } from "@/lib/catalog-types";
import type { ProductFormInput } from "@/lib/catalog-api";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductAdminDto | null | undefined>(undefined);

  useEffect(() => {
    // No single-product admin endpoint yet -- fine at this catalog size,
    // fetch the list and find it. Revisit if the catalog grows large.
    getAdminProducts().then((all) => setProduct(all.find((p) => p.id === id) ?? null));
  }, [id]);

  if (product === undefined) {
    return (
      <main className="flex-1 py-16">
        <Container size="xl">
          <p className="text-muted font-sans">Loading…</p>
        </Container>
      </main>
    );
  }
  if (product === null) {
    return (
      <main className="flex-1 py-16">
        <Container size="xl">
          <p className="text-danger font-sans">Product not found.</p>
        </Container>
      </main>
    );
  }

  function handleSubmit(input: ProductFormInput) {
    return updateProduct(id, { ...input, rowVersion: product!.rowVersion });
  }

  return (
    <main className="flex-1 py-16">
      <Container size="xl">
        <PageHeading eyebrow="Admin" className="mb-10">
          Edit product
        </PageHeading>
        <ProductForm initial={product} submitLabel="Save changes" onSubmit={handleSubmit} />
      </Container>
    </main>
  );
}
