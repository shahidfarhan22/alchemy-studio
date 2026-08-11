import Link from "next/link";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refunds & Shipping" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline mt-16">
      <div className="max-w-5xl mx-auto w-full px-6 py-8 flex flex-col items-center gap-4 text-center">
        <p className="text-xs uppercase tracking-eyebrow text-muted">
          Alchemy Studio — Limited casts, individually numbered — shipping across India
        </p>
        <nav aria-label="Legal" className="flex gap-6">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-eyebrow text-muted hover:text-gold transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
