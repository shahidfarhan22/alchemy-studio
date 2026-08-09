"use client";

import { ProductForm } from "../ProductForm";
import { createProduct } from "@/lib/catalog-api";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";

export default function NewProductPage() {
  return (
    <main className="flex-1 py-16">
      <Container size="xl">
        <PageHeading eyebrow="Admin" className="mb-10">
          New product
        </PageHeading>
        <ProductForm submitLabel="Create product" onSubmit={createProduct} />
      </Container>
    </main>
  );
}
