import type { ReactNode } from "react";

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger bg-danger-surface border border-danger/30 px-4 py-3">
      {children}
    </p>
  );
}
