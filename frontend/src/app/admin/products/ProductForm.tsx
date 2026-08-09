"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getPublicCategories } from "@/lib/catalog-api";
import type { CategoryDto, ProductAdminDto } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import type { ProductFormInput } from "@/lib/catalog-api";

type Props = {
  initial?: ProductAdminDto;
  onSubmit: (input: ProductFormInput) => Promise<unknown>;
  submitLabel: string;
};

export function ProductForm({ initial, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceRupees, setPriceRupees] = useState(initial ? (initial.priceInPaise / 100).toString() : "");
  const [stockQuantity, setStockQuantity] = useState(initial?.stockQuantity?.toString() ?? "0");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category.id ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPublicCategories().then((cats) => {
      setCategories(cats);
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const priceInPaise = Math.round(parseFloat(priceRupees || "0") * 100);

    try {
      await onSubmit({
        name,
        description,
        priceInPaise,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        imageUrl: imageUrl.trim() || null,
        categoryId,
        isPublished,
      });
      router.push("/admin/products");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.details) {
          setFieldErrors(Object.fromEntries(err.details.map((d) => [d.field, d.issue])));
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {formError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{formError}</p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2" />
        {fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
          rows={4} className="w-full rounded border border-gray-300 px-3 py-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="price">Price (INR)</label>
          <input id="price" type="number" step="0.01" min="0" value={priceRupees}
            onChange={(e) => setPriceRupees(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2" />
          {fieldErrors.priceInPaise && <p className="text-sm text-red-600 mt-1">{fieldErrors.priceInPaise}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="stock">Stock</label>
          <input id="stock" type="number" min="0" value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2" />
          {fieldErrors.stockQuantity && <p className="text-sm text-red-600 mt-1">{fieldErrors.stockQuantity}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="imageUrl">Image URL (optional)</label>
        <input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..." className="w-full rounded border border-gray-300 px-3 py-2" />
        <p className="text-xs text-gray-500 mt-1">
          Paste a URL to an already-hosted image. Direct upload isn&apos;t built yet.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="category">Category</label>
        <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2">
          {categories.length === 0 && <option value="">No categories yet — create one first</option>}
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Published (visible to customers)
      </label>

      <button type="submit" disabled={isSubmitting || !categoryId}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
