import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProductBySlug } from "@/lib/catalog-api";
import { PublicApiError } from "@/lib/public-api";
import { formatPrice } from "@/lib/catalog-types";
import { AddToCartButton } from "./AddToCartButton";
import { Container } from "@/components/ui/Container";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { HairlineRule } from "@/components/ui/HairlineRule";

// See public-api.ts / products/page.tsx for why this is force-dynamic
// rather than statically generated.
export const dynamic = "force-dynamic";

// Memoized so generateMetadata and the page body share one backend call per request.
const getProduct = cache((slug: string) => getPublicProductBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: `${product.name} | Alchemy Studio`,
      description:
        product.description || `${product.name} — a limited, individually-numbered miniature from Alchemy Studio.`,
      openGraph: product.imageUrl ? { images: [{ url: product.imageUrl }] } : undefined,
    };
  } catch {
    return { title: "Miniature | Alchemy Studio" };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await getProduct(slug).catch((err) => {
    if (err instanceof PublicApiError && err.status === 404) notFound();
    throw err;
  });

  return (
    <main className="flex-1 py-16">
      <Container size="lg">
        <div className="grid sm:grid-cols-2 gap-12">
          <div className="aspect-square bg-surface overflow-hidden">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted text-sm font-sans">No image</div>
            )}
          </div>

          <div>
            <EyebrowLabel className="block">{product.category.name}</EyebrowLabel>
            <h1 className="font-serif text-3xl mt-2">{product.name}</h1>
            <p className="font-sans text-xl mt-3 text-text">{formatPrice(product.priceInPaise, product.currency)}</p>
            <p className={`text-xs uppercase tracking-eyebrow mt-2 font-sans ${product.inStock ? "text-success" : "text-danger"}`}>
              {product.inStock ? "In stock" : "Out of stock"}
            </p>

            <HairlineRule className="my-6" />

            <p className="text-muted font-sans whitespace-pre-wrap leading-relaxed">{product.description}</p>

            <AddToCartButton productId={product.id} inStock={product.inStock} />
          </div>
        </div>
      </Container>
    </main>
  );
}
