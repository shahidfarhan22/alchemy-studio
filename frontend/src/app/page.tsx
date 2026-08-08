"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

// Placeholder landing page -- proves the auth loop works end-to-end.
// Real storefront content (catalog, etc.) starts at M2.
export default function Home() {
  const { user, isLoading, logout } = useAuth();

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Alchemy Studio</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : user ? (
        <div className="flex flex-col items-center gap-2">
          <p>
            Logged in as <strong>{user.displayName}</strong> ({user.roles.join(", ")})
          </p>
          <button onClick={() => logout()} className="underline text-sm">
            Log out
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link href="/login" className="underline">Log in</Link>
          <Link href="/register" className="underline">Register</Link>
        </div>
      )}
    </main>
  );
}
