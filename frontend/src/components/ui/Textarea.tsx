import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function Textarea({ invalid = false, className = "", ...rest }: TextareaProps) {
  const borderColor = invalid ? "border-danger" : "border-hairline focus:border-gold";
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`w-full bg-transparent border ${borderColor} px-3 py-2.5 text-text placeholder:text-muted transition-colors ${className}`}
      {...rest}
    />
  );
}
