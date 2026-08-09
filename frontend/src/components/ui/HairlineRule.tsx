type HairlineRuleProps = {
  variant?: "hairline" | "gold";
  className?: string;
};

export function HairlineRule({ variant = "hairline", className = "" }: HairlineRuleProps) {
  const color = variant === "gold" ? "bg-gold" : "bg-hairline";
  return <div role="separator" className={`h-px w-full ${color} ${className}`} />;
}
