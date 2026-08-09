import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ invalid = false, className = "", ...rest }: InputProps) {
  const borderColor = invalid ? "border-danger" : "border-hairline focus:border-gold";
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`w-full bg-transparent border ${borderColor} px-3 py-2.5 text-text placeholder:text-muted transition-colors ${className}`}
      {...rest}
    />
  );
}
