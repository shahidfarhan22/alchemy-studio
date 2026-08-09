"use client";

import { ProductForm } from "../ProductForm";
import { createProduct } from "@/lib/catalog-api";

export default function NewProductPage() {
  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">New product</h1>
      <ProductForm submitLabel="Create product" onSubmit={createProduct} />
    </main>
  );
}
