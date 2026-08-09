"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Catches failures from the Server Component fetches in this route segment
// (products/page.tsx, products/[slug]/page.tsx) -- e.g. the backend being
// unreachable. Per docs/architecture.md "Failure modes": don't crash, show
// a clear, safe-to-display message.
export default function ProductsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error("Products route error:", error);
  }, [error]);

  function handleRetry() {
    // reset() alone re-renders the error boundary but doesn't guarantee a
    // fresh server fetch for this segment's data; router.refresh() forces
    // Next.js to actually re-request it. Found this the hard way: reset()
    // alone left the button visually doing nothing when the backend was
    // still down, while a full page reload (which always re-fetches) worked.
    router.refresh();
    reset();
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Couldn&apos;t load products</h1>
      <p className="text-gray-600 max-w-sm">
        Something went wrong reaching the store. This is usually temporary — please try again in a moment.
      </p>
      <button onClick={handleRetry} className="rounded bg-black text-white px-4 py-2 text-sm">
        Try again
      </button>
    </main>
  );
}
