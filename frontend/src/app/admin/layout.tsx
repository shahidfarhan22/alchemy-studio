"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// Client-side redirect only. The REAL protection is the backend's
// [Authorize(Roles = Roles.Admin)] on every admin endpoint (MASTER-PROMPT.md:
// "never rely on hiding a button in the frontend") -- this just avoids
// flashing admin UI at a non-admin before the backend would reject their
// requests anyway.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.roles.includes("Admin") ?? false;

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/login");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted font-sans">Loading…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return null; // redirect effect above will kick in
  }

  return (
    <div className="flex-1 flex flex-col">
      <nav className="border-b border-hairline px-6 py-4 flex items-center gap-6 text-xs uppercase tracking-eyebrow">
        <Link href="/admin/products" className="text-text hover:text-gold transition-colors">
          Products
        </Link>
        <Link href="/admin/categories" className="text-text hover:text-gold transition-colors">
          Categories
        </Link>
        <Link href="/" className="text-muted hover:text-text transition-colors ml-auto">
          Back to store
        </Link>
      </nav>
      {children}
    </div>
  );
}
