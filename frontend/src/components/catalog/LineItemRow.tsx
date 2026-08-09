import Link from "next/link";
import type { ReactNode } from "react";

type LineItemRowProps = {
  name: string;
  href?: string;
  /** Pass `null`/URL for a thumbnail slot, or omit entirely to skip it (checkout/order summaries don't show one). */
  imageUrl?: string | null;
  subtitle?: ReactNode;
  right: ReactNode;
};

export function LineItemRow({ name, href, imageUrl, subtitle, right }: LineItemRowProps) {
  const nameEl = href ? (
    <Link href={href} className="font-serif text-base text-text hover:text-gold transition-colors">
      {name}
    </Link>
  ) : (
    <span className="font-serif text-base text-text">{name}</span>
  );

  return (
    <li className="py-4 flex gap-4 items-center">
      {imageUrl !== undefined && (
        <div className="w-16 h-16 bg-surface overflow-hidden shrink-0">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : null}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {nameEl}
        {subtitle && <div className="text-sm text-muted mt-0.5 font-sans">{subtitle}</div>}
      </div>
      <div className="text-sm font-sans shrink-0">{right}</div>
    </li>
  );
}
