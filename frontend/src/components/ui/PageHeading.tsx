import type { ReactNode } from "react";
import { EyebrowLabel } from "./EyebrowLabel";

type PageHeadingProps = {
  eyebrow?: ReactNode;
  children: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function PageHeading({ eyebrow, children, align = "left", className = "" }: PageHeadingProps) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      {eyebrow && (
        <EyebrowLabel as="p" wide className="mb-3">
          {eyebrow}
        </EyebrowLabel>
      )}
      <h1 className={`font-serif text-3xl sm:text-4xl leading-tight text-balance ${className}`}>{children}</h1>
    </div>
  );
}
