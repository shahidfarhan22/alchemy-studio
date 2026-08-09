"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getPublicCategories, createCategory } from "@/lib/catalog-api";
import type { CategoryDto } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { HairlineRule } from "@/components/ui/HairlineRule";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    getPublicCategories().then(setCategories);
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createCategory(name);
      setName("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 py-16">
      <Container size="sm">
        <PageHeading eyebrow="Admin" className="mb-10">
          Categories
        </PageHeading>

        <ul className="mb-8 divide-y divide-hairline font-sans">
          {categories.map((c) => (
            <li key={c.id} className="text-sm py-2.5 text-text">
              {c.name}
            </li>
          ))}
          {categories.length === 0 && <li className="text-sm text-muted py-2.5">No categories yet.</li>}
        </ul>

        <HairlineRule className="mb-6" />

        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
          <Button type="submit" disabled={isSubmitting || !name.trim()} variant="outline">
            Add
          </Button>
        </form>
        {error && (
          <div className="mt-4">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}
      </Container>
    </main>
  );
}
