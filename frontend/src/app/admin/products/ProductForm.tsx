"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getPublicCategories } from "@/lib/catalog-api";
import type { CategoryDto, ProductAdminDto } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import type { ProductFormInput } from "@/lib/catalog-api";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FieldError } from "@/components/ui/FieldError";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Button } from "@/components/ui/Button";

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
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {formError && <ErrorBanner>{formError}</ErrorBanner>}

      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} invalid={!!fieldErrors.name} />
        <FieldError>{fieldErrors.name}</FieldError>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (INR)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={priceRupees}
            onChange={(e) => setPriceRupees(e.target.value)}
            invalid={!!fieldErrors.priceInPaise}
          />
          <FieldError>{fieldErrors.priceInPaise}</FieldError>
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            invalid={!!fieldErrors.stockQuantity}
          />
          <FieldError>{fieldErrors.stockQuantity}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        <p className="text-xs text-muted font-sans mt-1.5">
          Paste a URL to an already-hosted image. Direct upload isn&apos;t built yet.
        </p>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.length === 0 && <option value="">No categories yet — create one first</option>}
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex items-center gap-2.5 text-sm font-sans text-muted">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="accent-[#c9a227]"
        />
        Published (visible to customers)
      </label>

      <Button type="submit" disabled={isSubmitting || !categoryId}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
