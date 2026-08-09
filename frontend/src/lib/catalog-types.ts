// Mirrors backend/src/AlchemyStudio.Api/Catalog/CatalogDtos.cs -- keep in
// sync by hand until docs/api.md gives us a generated contract.

export type CategoryDto = { id: string; name: string; slug: string };

export type ProductPublicDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInPaise: number;
  currency: string;
  imageUrl: string | null;
  inStock: boolean;
  category: CategoryDto;
};

export type ProductAdminDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInPaise: number;
  currency: string;
  imageUrl: string | null;
  stockQuantity: number;
  isPublished: boolean;
  category: CategoryDto;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
};

export function formatPrice(priceInPaise: number, currency: string): string {
  return (priceInPaise / 100).toLocaleString("en-IN", { style: "currency", currency });
}
