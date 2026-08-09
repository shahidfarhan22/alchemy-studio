import { apiFetch } from "./api-client";
import { publicFetch } from "./public-api";
import type { CategoryDto, ProductAdminDto, ProductPublicDto } from "./catalog-types";

// --- Public (server- or client-safe, no auth) ---

export const getPublicProducts = () => publicFetch<ProductPublicDto[]>("/api/v1/products");
export const getPublicProductBySlug = (slug: string) =>
  publicFetch<ProductPublicDto>(`/api/v1/products/${encodeURIComponent(slug)}`);
export const getPublicCategories = () => publicFetch<CategoryDto[]>("/api/v1/categories");

// --- Admin (browser-only, needs the in-memory access token) ---

export const getAdminProducts = () => apiFetch<ProductAdminDto[]>("/api/v1/admin/products");

export type ProductFormInput = {
  name: string;
  description: string;
  priceInPaise: number;
  stockQuantity: number;
  imageUrl: string | null;
  categoryId: string;
  isPublished: boolean;
};

export const createProduct = (input: ProductFormInput) =>
  apiFetch<ProductAdminDto>("/api/v1/admin/products", { method: "POST", body: input });

export const updateProduct = (id: string, input: ProductFormInput & { rowVersion: number }) =>
  apiFetch<ProductAdminDto>(`/api/v1/admin/products/${id}`, { method: "PUT", body: input });

export const deleteProduct = (id: string) =>
  apiFetch<void>(`/api/v1/admin/products/${id}`, { method: "DELETE" });

export const createCategory = (name: string) =>
  apiFetch<CategoryDto>("/api/v1/admin/categories", { method: "POST", body: { name } });
