"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

// App-wide fallback for anything not caught by a more specific error.tsx
// (e.g. products/error.tsx). Satisfies AGENTS.md's "global error boundary,
// wired once" -- doesn't replace route-specific ones, just backstops them.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  function handleRetry() {
    // See products/error.tsx for why reset() alone isn't enough.
    router.refresh();
    reset();
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <h1 className="font-serif text-2xl">Something went wrong</h1>
      <p className="text-muted font-sans max-w-sm">
        An unexpected error occurred. Please try again, or head back to the homepage.
      </p>
      <div className="flex gap-4">
        <Button onClick={handleRetry}>Try again</Button>
        <Button href="/" variant="outline">
          Go home
        </Button>
      </div>
    </main>
  );
}
