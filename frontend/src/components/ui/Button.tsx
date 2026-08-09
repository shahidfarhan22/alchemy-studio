import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "solid" | "outline" | "ghost";

type CommonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "className"> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "inline-flex items-center justify-center gap-2 text-xs tracking-eyebrow-wide uppercase font-sans transition-colors duration-150";

// The default resting state for solid/outline is deliberately quiet (gold
// outline, not a filled block) -- filling gold is reserved for hover, so the
// accent stays an accent rather than a wash of color on every page.
const variants: Record<ButtonVariant, string> = {
  solid: "bg-gold text-bg px-6 py-3 hover:bg-gold-hover",
  outline: "border border-gold text-gold px-6 py-3 hover:bg-gold hover:text-bg",
  ghost: "text-muted px-0 py-1 tracking-normal normal-case hover:text-gold",
};

export function Button({ variant = "solid", fullWidth = false, disabled = false, className = "", children, href, ...rest }: ButtonProps) {
  const classes = [base, variants[variant], fullWidth ? "w-full" : "", disabled ? "opacity-40 pointer-events-none" : "", className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} aria-disabled={disabled || undefined} className={classes} {...(rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">)}>
        {children}
      </Link>
    );
  }

  return (
    <button disabled={disabled} className={classes} {...(rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "className">)}>
      {children}
    </button>
  );
}
