import Link from "next/link";
import { getPublicProducts } from "@/lib/catalog-api";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/Button";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { HairlineRule } from "@/components/ui/HairlineRule";

// Fetches live from the backend per-request, same reasoning as products/page.tsx
// -- static generation at build time would need the backend reachable during
// the build, and frontend/backend are separate deployables (ADR-003).
export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getPublicProducts();
  const preview = products.slice(0, 4);

  return (
    <main className="flex-1">
      <section className="px-6 py-24 sm:py-32 text-center">
        <EyebrowLabel wide className="block mb-6">
          Limited casts · Individually numbered
        </EyebrowLabel>
        <h1 className="font-serif text-4xl sm:text-6xl leading-tight text-balance max-w-3xl mx-auto">
          Miniature, in the fullest sense of craft.
        </h1>
        <p className="mt-6 text-muted font-sans max-w-xl mx-auto leading-relaxed">
          A small collection of resin-cast fantasy and sci-fi figures, released in limited runs and finished
          entirely by hand — shipped across India.
        </p>
        <div className="mt-10">
          <Button href="/products" variant="outline">
            View the collection
          </Button>
        </div>
      </section>

      <HairlineRule />

      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-serif text-2xl">Current release</h2>
          {products.length > 4 && (
            <Link href="/products" className="text-xs uppercase tracking-eyebrow text-muted hover:text-gold transition-colors">
              View all →
            </Link>
          )}
        </div>

        {preview.length === 0 ? (
          <p className="text-muted font-sans">The first pieces are still on the workbench — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {preview.map((product, i) => (
              <ProductCard key={product.id} product={product} lotNumber={i + 1} />
            ))}
          </div>
        )}
      </section>

      <HairlineRule />

      <section className="px-6 py-20 text-center">
        <EyebrowLabel wide className="block mb-6">
          Have something specific in mind?
        </EyebrowLabel>
        <h2 className="font-serif text-3xl max-w-xl mx-auto text-balance">Commission a custom piece.</h2>
        <p className="mt-4 text-muted font-sans max-w-lg mx-auto leading-relaxed">
          Send a description or reference image and we&apos;ll follow up with a quote.
        </p>
        <div className="mt-8">
          <Button href="/custom-orders/new" variant="outline">
            Start a request
          </Button>
        </div>
      </section>
    </main>
  );
}
