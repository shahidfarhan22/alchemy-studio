"use client";

import { useEffect, useState } from "react";
import { getAdminProducts, deleteProduct } from "@/lib/catalog-api";
import { formatPrice, type ProductAdminDto } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Button } from "@/components/ui/Button";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductAdminDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    getAdminProducts()
      .then((data) => {
        setProducts(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load products."));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone from the UI.`)) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="flex-1 py-16">
      <Container size="xl">
        <div className="flex items-center justify-between mb-10">
          <PageHeading eyebrow="Admin">Products</PageHeading>
          <Button href="/admin/products/new">New product</Button>
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {products === null ? (
          <p className="text-muted font-sans mt-4">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-muted font-sans mt-4">No products yet.</p>
        ) : (
          <table className="w-full text-sm font-sans mt-6">
            <thead>
              <tr className="text-left border-b border-hairline text-xs uppercase tracking-eyebrow text-muted">
                <th className="py-3 font-normal">Name</th>
                <th className="py-3 font-normal">Price</th>
                <th className="py-3 font-normal">Stock</th>
                <th className="py-3 font-normal">Status</th>
                <th className="py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-hairline">
                  <td className="py-3 font-serif text-text">{p.name}</td>
                  <td className="py-3">{formatPrice(p.priceInPaise, p.currency)}</td>
                  <td className="py-3">{p.stockQuantity}</td>
                  <td className="py-3">
                    <span className={`text-xs uppercase tracking-eyebrow ${p.isPublished ? "text-success" : "text-muted"}`}>
                      {p.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-5">
                    <Button href={`/admin/products/${p.id}/edit`} variant="ghost">
                      Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="text-xs uppercase tracking-eyebrow text-danger hover:text-text transition-colors disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Container>
    </main>
  );
}
