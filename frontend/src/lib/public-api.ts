// Fetch helper for public, unauthenticated endpoints -- safe to call from
// Server Components (SSR/ISR for SEO, per docs/architecture.md) as well as
// the browser. Deliberately separate from api-client.ts, which depends on
// the in-memory access token and is browser-only.

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured (frontend/.env.local).");
}

export class PublicApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function publicFetch<T>(path: string): Promise<T> {
  // no-store, not ISR: frontend and backend are separate deployables
  // (ADR-003) that don't build together, so a build-time fetch (which ISR's
  // static generation would require) can't assume the backend is reachable.
  // Pages using this are marked `export const dynamic = "force-dynamic"`.
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new PublicApiError(data?.error?.message ?? "Something went wrong.", response.status);
  }

  return response.json();
}
