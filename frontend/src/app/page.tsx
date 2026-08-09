"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

// Placeholder landing page -- proves the auth + catalog loops work end-to-end.
// Real storefront design starts once there's real product content.
export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const isAdmin = user?.roles.includes("Admin") ?? false;

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Alchemy Studio</h1>

      <Link href="/products" className="underline">Browse products</Link>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : user ? (
        <div className="flex flex-col items-center gap-2">
          <p>
            Logged in as <strong>{user.displayName}</strong> ({user.roles.join(", ")})
          </p>
          {isAdmin && <Link href="/admin/products" className="underline">Admin panel</Link>}
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
