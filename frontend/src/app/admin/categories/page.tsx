"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getPublicCategories, createCategory } from "@/lib/catalog-api";
import type { CategoryDto } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";

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
    <main className="flex-1 p-6 max-w-lg mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">Categories</h1>

      <ul className="mb-6 space-y-1">
        {categories.map((c) => <li key={c.id} className="text-sm">{c.name}</li>)}
        {categories.length === 0 && <li className="text-sm text-gray-500">No categories yet.</li>}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={isSubmitting || !name.trim()}
          className="rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-50">
          Add
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>}
    </main>
  );
}
