import type { ReactNode } from "react";

type LegalSectionProps = {
  heading: string;
  children: ReactNode;
};

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl mb-3">{heading}</h2>
      <div className="font-sans text-sm text-muted leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
