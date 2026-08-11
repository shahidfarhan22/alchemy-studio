import type { MetadataRoute } from "next";
import { getPublicProducts } from "@/lib/catalog-api";

const BASE_URL = "https://alchemystudios.co.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/products`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/custom-orders/new`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Best-effort: if the backend is unreachable at build/request time, still
  // serve the static routes rather than failing the whole sitemap.
  const products = await getPublicProducts().catch(() => []);
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/products/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
