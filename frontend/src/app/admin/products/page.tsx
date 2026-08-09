"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminProducts, deleteProduct } from "@/lib/catalog-api";
import { formatPrice, type ProductAdminDto } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";

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
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="rounded bg-black text-white px-4 py-2 text-sm">
          New product
        </Link>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-4">{error}</p>}

      {products === null ? (
        <p className="text-gray-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Price</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.name}</td>
                <td className="py-2">{formatPrice(p.priceInPaise, p.currency)}</td>
                <td className="py-2">{p.stockQuantity}</td>
                <td className="py-2">{p.isPublished ? "Published" : "Draft"}</td>
                <td className="py-2 text-right space-x-3">
                  <Link href={`/admin/products/${p.id}/edit`} className="underline">Edit</Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deletingId === p.id}
                    className="underline text-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
