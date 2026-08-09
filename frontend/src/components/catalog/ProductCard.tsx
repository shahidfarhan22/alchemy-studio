import Link from "next/link";
import type { ProductPublicDto } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/catalog-types";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";

type ProductCardProps = {
  product: ProductPublicDto;
  /** 1-indexed grid position. Purely a display artifice (no persisted "lot"
   *  concept exists in the product schema) -- omit on pages without a stable
   *  grid position, like the product detail page. */
  lotNumber?: number;
};

export function ProductCard({ product, lotNumber }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-[4/5] bg-surface overflow-hidden">
        {product.imageUrl ? (
          // Plain <img>, not next/image: image URLs are arbitrary
          // admin-pasted values (ADR-010), not from a known set of hosts --
          // next/image would need a wildcard remote pattern, turning the
          // optimizer into an open proxy for any URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm font-sans">No image</div>
        )}
      </div>

      <div className="mt-4 relative inline-block w-full">
        <EyebrowLabel className="block mb-1.5">
          {lotNumber !== undefined ? `Lot ${String(lotNumber).padStart(2, "0")} — ${product.category.name}` : product.category.name}
        </EyebrowLabel>
        <h3 className="font-serif text-lg text-text">{product.name}</h3>
        <p className="mt-1 text-sm text-muted font-sans">{formatPrice(product.priceInPaise, product.currency)}</p>
        {!product.inStock && <p className="mt-1 text-xs uppercase tracking-eyebrow text-danger">Out of stock</p>}

        <span
          aria-hidden
          className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full"
        />
      </div>
    </Link>
  );
}
