"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
    <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <h1 className="font-serif text-2xl">Couldn&apos;t load products</h1>
      <p className="text-muted font-sans max-w-sm">
        Something went wrong reaching the store. This is usually temporary — please try again in a moment.
      </p>
      <Button onClick={handleRetry}>Try again</Button>
    </main>
  );
}
