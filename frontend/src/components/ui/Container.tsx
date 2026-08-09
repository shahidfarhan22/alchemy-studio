import type { ReactNode } from "react";

const sizes = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

type ContainerProps = {
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
};

export function Container({ size = "md", className = "", children }: ContainerProps) {
  return <div className={`${sizes[size]} mx-auto w-full px-6 ${className}`}>{children}</div>;
}
