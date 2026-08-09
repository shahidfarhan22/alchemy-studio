"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const isAdmin = user?.roles.includes("Admin") ?? false;

  return (
    <header className="border-b border-hairline">
      <div className="max-w-5xl mx-auto w-full px-6 py-5 flex items-center justify-between gap-6">
        <Link href="/" className="font-serif text-lg tracking-eyebrow uppercase text-text hover:text-gold transition-colors">
          Alchemy <span className="text-gold">Studio</span>
        </Link>

        <nav className="flex items-center gap-6 text-xs uppercase tracking-eyebrow text-muted">
          <Link href="/products" className="hover:text-text transition-colors">
            Collection
          </Link>
          <Link href="/custom-orders" className="hover:text-text transition-colors">
            Commission
          </Link>
          <Link href="/cart" className="hover:text-text transition-colors">
            Cart
          </Link>

          {isLoading ? (
            <span aria-hidden>···</span>
          ) : user ? (
            <div className="flex items-center gap-6">
              {isAdmin && (
                <Link href="/admin/products" className="hover:text-gold transition-colors">
                  Admin
                </Link>
              )}
              <span className="text-text normal-case tracking-normal font-sans">{user.displayName}</span>
              <button type="button" onClick={() => logout()} className="hover:text-text transition-colors">
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-text transition-colors">
                Log in
              </Link>
              <Link href="/register" className="hover:text-gold transition-colors">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
