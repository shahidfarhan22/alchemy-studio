import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ invalid = false, className = "", ...rest }: SelectProps) {
  const borderColor = invalid ? "border-danger" : "border-hairline focus:border-gold";
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`w-full bg-surface border ${borderColor} px-3 py-2.5 text-text transition-colors ${className}`}
      {...rest}
    />
  );
}
