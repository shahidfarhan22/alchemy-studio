import type { LabelHTMLAttributes, ReactNode } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode };

export function Label({ children, className = "", ...rest }: LabelProps) {
  return (
    <label className={`block text-xs uppercase tracking-eyebrow text-muted mb-2 ${className}`} {...rest}>
      {children}
    </label>
  );
}
