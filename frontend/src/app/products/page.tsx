import Link from "next/link";
import { getPublicProducts } from "@/lib/catalog-api";
import { formatPrice } from "@/lib/catalog-types";

export const metadata = { title: "Products | Alchemy Studio" };
// Fetches live from the backend per-request -- see public-api.ts for why
// this isn't statically generated/ISR.
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getPublicProducts();

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-6">
      <h1 className="text-2xl font-semibold mb-6">Products</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group">
              <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                {product.imageUrl ? (
                  // Plain <img>, not next/image: image URLs are arbitrary
                  // admin-pasted values (ADR-010), not from a known set of
                  // hosts -- next/image would need a wildcard remote pattern,
                  // turning the optimizer into an open proxy for any URL.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    No image
                  </div>
                )}
              </div>
              <h2 className="mt-2 text-sm font-medium group-hover:underline">{product.name}</h2>
              <p className="text-sm text-gray-600">{formatPrice(product.priceInPaise, product.currency)}</p>
              {!product.inStock && <p className="text-xs text-red-600">Out of stock</p>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
