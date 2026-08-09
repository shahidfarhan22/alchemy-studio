import { getPublicProducts } from "@/lib/catalog-api";
import { ProductCard } from "@/components/catalog/ProductCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "The Collection | Alchemy Studio" };
// Fetches live from the backend per-request -- see public-api.ts for why
// this isn't statically generated/ISR.
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getPublicProducts();

  return (
    <main className="flex-1 py-16">
      <Container size="xl">
        <PageHeading eyebrow="Released in limited, numbered runs" className="mb-12">
          The collection
        </PageHeading>

        {products.length === 0 ? (
          <p className="text-muted font-sans">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} lotNumber={i + 1} />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
