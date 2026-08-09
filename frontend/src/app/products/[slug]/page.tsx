import { notFound } from "next/navigation";
import { getPublicProductBySlug } from "@/lib/catalog-api";
import { PublicApiError } from "@/lib/public-api";
import { formatPrice } from "@/lib/catalog-types";

// See public-api.ts / products/page.tsx for why this is force-dynamic
// rather than statically generated.
export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await getPublicProductBySlug(slug).catch((err) => {
    if (err instanceof PublicApiError && err.status === 404) notFound();
    throw err;
  });

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-6">
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-500">{product.category.name}</p>
          <h1 className="text-2xl font-semibold mt-1">{product.name}</h1>
          <p className="text-xl mt-2">{formatPrice(product.priceInPaise, product.currency)}</p>
          <p className={`text-sm mt-1 ${product.inStock ? "text-green-700" : "text-red-600"}`}>
            {product.inStock ? "In stock" : "Out of stock"}
          </p>
          <p className="mt-4 text-gray-700 whitespace-pre-wrap">{product.description}</p>
        </div>
      </div>
    </main>
  );
}
