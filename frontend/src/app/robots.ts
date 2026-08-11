import type { MetadataRoute } from "next";

const BASE_URL = "https://alchemystudios.co.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /custom-orders/new is the public commission-request page, worth
      // indexing -- everything else under /custom-orders is a signed-in
      // user's own request list/detail, same as /orders.
      allow: ["/", "/custom-orders/new"],
      disallow: ["/admin", "/cart", "/checkout", "/orders", "/custom-orders", "/login", "/register"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
