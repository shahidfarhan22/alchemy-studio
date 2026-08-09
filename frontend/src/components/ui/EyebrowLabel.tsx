import type { ElementType, ReactNode } from "react";

type EyebrowLabelProps = {
  children: ReactNode;
  tone?: "gold" | "muted";
  wide?: boolean;
  as?: ElementType;
  className?: string;
};

export function EyebrowLabel({ children, tone = "gold", wide = false, as: Tag = "span", className = "" }: EyebrowLabelProps) {
  const toneClass = tone === "gold" ? "text-gold" : "text-muted";
  const trackClass = wide ? "tracking-eyebrow-wide" : "tracking-eyebrow";
  return <Tag className={`text-xs uppercase font-sans ${trackClass} ${toneClass} ${className}`}>{children}</Tag>;
}
