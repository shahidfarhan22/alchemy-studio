"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-gray-600 max-w-sm">
        An unexpected error occurred. Please try again, or head back to the homepage.
      </p>
      <div className="flex gap-4">
        <button onClick={handleRetry} className="rounded bg-black text-white px-4 py-2 text-sm">
          Try again
        </button>
        <Link href="/" className="rounded border px-4 py-2 text-sm">
          Go home
        </Link>
      </div>
    </main>
  );
}
